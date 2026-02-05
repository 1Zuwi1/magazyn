package com.github.dawid_stolarczyk.magazyn.Services.Ai;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.IdentificationCandidate;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ItemIdentificationResponse;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.AuditLog;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Item;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.ConfidenceLevel;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.AuditLogRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.ItemRepository;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.RateLimitOperation;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.github.dawid_stolarczyk.magazyn.Utils.InternetUtils.getClientIp;

/**
 * Service for visual item identification using image similarity.
 * Converts uploaded images to embeddings and finds the most similar item(s) in the database.
 *
 * <p>Implements a three-tier confidence strategy:
 * <ul>
 *   <li>HIGH_CONFIDENCE (>= highConfidenceThreshold): single best result</li>
 *   <li>NEEDS_VERIFICATION (>= similarityThreshold): single result with verification flag</li>
 *   <li>LOW_CONFIDENCE (below similarityThreshold): Top-K candidates</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VisualIdentificationService {

    private final ImageEmbeddingService imageEmbeddingService;
    private final ItemRepository itemRepository;
    private final AuditLogRepository auditLogRepository;
    private final VisualIdentificationAlertService alertService;
    private final Bucket4jRateLimiter rateLimiter;

    @Value("${app.visual-identification.threshold:0.7}")
    private double similarityThreshold;

    @Value("${app.visual-identification.high-confidence-threshold:0.88}")
    private double highConfidenceThreshold;

    @Value("${app.visual-identification.low-confidence-candidate-count:5}")
    private int lowConfidenceCandidateCount;

    @Value("${app.visual-identification.mismatch-alternative-count:3}")
    private int mismatchAlternativeCount;

    @Value("${app.visual-identification.embedding-cache-ttl-minutes:15}")
    private int embeddingCacheTtlMinutes;

    private Cache<String, IdentificationSession> sessionCache;

    @PostConstruct
    public void initCache() {
        sessionCache = Caffeine.newBuilder()
                .expireAfterWrite(Duration.ofMinutes(embeddingCacheTtlMinutes))
                .maximumSize(1000)
                .build();
    }

    /**
     * Holds the state of an identification session: the query embedding
     * and the accumulated set of rejected (excluded) item IDs.
     */
    private static class IdentificationSession {
        private final String embeddingStr;
        private final Set<Long> excludedIds = Collections.synchronizedSet(new LinkedHashSet<>());

        IdentificationSession(String embeddingStr) {
            this.embeddingStr = embeddingStr;
        }

        void addExcludedId(Long id) {
            excludedIds.add(id);
        }

        List<Long> getExcludedIdList() {
            return List.copyOf(excludedIds);
        }
    }

    /**
     * Identifies an item from an uploaded image using tiered confidence strategy.
     *
     * @param file        the image file to identify
     * @param currentUser the user performing the identification (may be null)
     * @param request     the HTTP request for rate limiting and audit logging
     * @return identification result with item details, similarity score, and candidates
     */
    @Transactional
    public ItemIdentificationResponse identifyItem(MultipartFile file, User currentUser,
                                                   HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);

        String originalFilename = file != null ? file.getOriginalFilename() : null;
        String ipAddress = getClientIp(request);
        String userAgent = request.getHeader("User-Agent");

        try {
            // Generate embedding from the uploaded image
            float[] embedding = imageEmbeddingService.getEmbedding(file);
            String embeddingStr = imageEmbeddingService.embeddingToVectorString(embedding);

            // Generate identification session ID and cache the session
            String identificationId = UUID.randomUUID().toString();
            sessionCache.put(identificationId, new IdentificationSession(embeddingStr));

            // Fetch Top-N candidates from database
            List<Object[]> results = itemRepository.findMostSimilarByEmbedding(
                    embeddingStr, lowConfidenceCandidateCount);

            if (results.isEmpty()) {
                return handleNoItemsFound(identificationId, currentUser,
                        originalFilename, ipAddress, userAgent);
            }

            // Compute similarity score for the best result
            double bestDistance = ((Number) results.get(0)[1]).doubleValue();
            double bestScore = imageEmbeddingService.distanceToSimilarityScore(bestDistance);

            // Determine confidence tier
            ConfidenceLevel confidenceLevel = determineConfidence(bestScore);

            // Build candidate list based on confidence tier
            List<Object[]> candidateRows;
            if (confidenceLevel == ConfidenceLevel.LOW_CONFIDENCE) {
                candidateRows = results; // all Top-N
            } else {
                candidateRows = List.<Object[]>of(results.get(0)); // best match only
            }

            List<IdentificationCandidate> candidates = buildCandidates(candidateRows);

            // For HIGH/NEEDS_VERIFICATION, set the best match in top-level fields
            Item bestItem = null;
            if (confidenceLevel != ConfidenceLevel.LOW_CONFIDENCE && !candidates.isEmpty()) {
                bestItem = itemRepository.findById(candidates.get(0).getItemId()).orElse(null);
            }

            // Alert generation: only for LOW_CONFIDENCE
            boolean alertGenerated = false;
            if (confidenceLevel == ConfidenceLevel.LOW_CONFIDENCE && bestItem == null) {
                // For LOW_CONFIDENCE, fetch the best item for alert purposes
                Long bestItemId = ((Number) results.get(0)[0]).longValue();
                bestItem = itemRepository.findById(bestItemId).orElse(null);
            }

            if (confidenceLevel == ConfidenceLevel.LOW_CONFIDENCE && bestItem != null) {
                log.warn("Low confidence match for item '{}' (id={}): {}% < {}% threshold",
                        bestItem.getName(), bestItem.getId(),
                        String.format("%.2f", bestScore * 100),
                        String.format("%.2f", similarityThreshold * 100));
                alertGenerated = alertService.createLowSimilarityAlertIfNeeded(
                        bestItem, bestScore, similarityThreshold, currentUser);
            }

            // Audit log
            logIdentification(currentUser,
                    bestItem != null ? bestItem : findItemForAudit(results.get(0)),
                    bestScore, true, null, originalFilename, ipAddress, userAgent);

            // Build response
            boolean confidentMatch = confidenceLevel != ConfidenceLevel.LOW_CONFIDENCE;
            boolean needsVerification = confidenceLevel == ConfidenceLevel.NEEDS_VERIFICATION;

            return ItemIdentificationResponse.builder()
                    .identificationId(identificationId)
                    .itemId(confidentMatch && bestItem != null ? bestItem.getId() : null)
                    .itemName(confidentMatch && bestItem != null ? bestItem.getName() : null)
                    .barcode(confidentMatch && bestItem != null ? bestItem.getBarcode() : null)
                    .similarityScore(bestScore)
                    .confidentMatch(confidentMatch)
                    .confidenceLevel(confidenceLevel)
                    .needsVerification(needsVerification)
                    .alertGenerated(alertGenerated)
                    .message(buildMessage(confidenceLevel))
                    .candidates(candidates)
                    .candidateCount(candidates.size())
                    .excludedItemIds(List.of())
                    .build();

        } catch (ImageEmbeddingService.ImageEmbeddingException e) {
            log.warn("Image embedding failed: {}", e.getMessage());
            logIdentification(currentUser, null, null, false, e.getMessage(),
                    originalFilename, ipAddress, userAgent);
            throw new VisualIdentificationException("Failed to process image: " + e.getMessage(), e);
        }
    }

    /**
     * Handles a user rejecting a visual match.
     * Adds the rejected item to the session's cumulative exclusion list
     * and retrieves alternatives excluding ALL previously rejected items.
     *
     * @param identificationId the session ID from the original identify call
     * @param rejectedItemId   the ID of the item the user rejected
     * @param currentUser      the user performing the action (may be null)
     * @param request          the HTTP request
     * @return response with alternative candidates (excluding all rejected items)
     */
    @Transactional
    public ItemIdentificationResponse handleMismatch(String identificationId,
                                                     Long rejectedItemId,
                                                     User currentUser,
                                                     HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);

        String ipAddress = getClientIp(request);
        String userAgent = request.getHeader("User-Agent");

        // Retrieve session from cache
        IdentificationSession session = sessionCache.getIfPresent(identificationId);
        if (session == null) {
            throw new VisualIdentificationException(
                    "Identification session expired or not found. Sessions are valid for "
                            + embeddingCacheTtlMinutes + " minutes.");
        }

        // Add newly rejected item to cumulative exclusion list
        session.addExcludedId(rejectedItemId);
        List<Long> allExcluded = session.getExcludedIdList();

        // Log the mismatch event (includes full exclusion list)
        logMismatch(currentUser, rejectedItemId, allExcluded, identificationId, ipAddress, userAgent);

        // Query excluding ALL previously rejected items
        List<Object[]> results = itemRepository.findMostSimilarExcluding(
                session.embeddingStr, allExcluded, mismatchAlternativeCount);

        if (results.isEmpty()) {
            return ItemIdentificationResponse.builder()
                    .identificationId(identificationId)
                    .itemId(null)
                    .itemName(null)
                    .barcode(null)
                    .similarityScore(0.0)
                    .confidentMatch(false)
                    .confidenceLevel(ConfidenceLevel.LOW_CONFIDENCE)
                    .needsVerification(false)
                    .alertGenerated(false)
                    .message("No alternative candidates found after excluding "
                            + allExcluded.size() + " rejected item(s)")
                    .candidates(List.of())
                    .candidateCount(0)
                    .excludedItemIds(allExcluded)
                    .build();
        }

        List<IdentificationCandidate> candidates = buildCandidates(results);
        IdentificationCandidate best = candidates.get(0);
        ConfidenceLevel level = determineConfidence(best.getSimilarityScore());
        boolean confidentMatch = level != ConfidenceLevel.LOW_CONFIDENCE;

        return ItemIdentificationResponse.builder()
                .identificationId(identificationId)
                .itemId(confidentMatch ? best.getItemId() : null)
                .itemName(confidentMatch ? best.getItemName() : null)
                .barcode(confidentMatch ? best.getBarcode() : null)
                .similarityScore(best.getSimilarityScore())
                .confidentMatch(confidentMatch)
                .confidenceLevel(level)
                .needsVerification(level == ConfidenceLevel.NEEDS_VERIFICATION)
                .alertGenerated(false)
                .message("Alternative candidates after excluding "
                        + allExcluded.size() + " rejected item(s)")
                .candidates(candidates)
                .candidateCount(candidates.size())
                .excludedItemIds(allExcluded)
                .build();
    }

    private ConfidenceLevel determineConfidence(double similarityScore) {
        if (similarityScore >= highConfidenceThreshold) {
            return ConfidenceLevel.HIGH_CONFIDENCE;
        }
        if (similarityScore >= similarityThreshold) {
            return ConfidenceLevel.NEEDS_VERIFICATION;
        }
        return ConfidenceLevel.LOW_CONFIDENCE;
    }

    private List<IdentificationCandidate> buildCandidates(List<Object[]> queryResults) {
        // Extract all item IDs
        List<Long> itemIds = queryResults.stream()
                .map(row -> ((Number) row[0]).longValue())
                .toList();

        // Batch fetch all items
        Map<Long, Item> itemMap = itemRepository.findAllById(itemIds).stream()
                .collect(Collectors.toMap(Item::getId, Function.identity()));

        // Build candidate list preserving order
        List<IdentificationCandidate> candidates = new ArrayList<>();
        for (int i = 0; i < queryResults.size(); i++) {
            Object[] row = queryResults.get(i);
            Long itemId = ((Number) row[0]).longValue();
            double distance = ((Number) row[1]).doubleValue();
            double score = imageEmbeddingService.distanceToSimilarityScore(distance);
            Item item = itemMap.get(itemId);

            if (item != null) {
                candidates.add(IdentificationCandidate.builder()
                        .itemId(item.getId())
                        .itemName(item.getName())
                        .barcode(item.getBarcode())
                        .photoUrl(item.getPhoto_url())
                        .weight(item.getWeight())
                        .isDangerous(item.isDangerous())
                        .cosineDistance(distance)
                        .similarityScore(score)
                        .rank(i + 1)
                        .build());
            }
        }
        return candidates;
    }

    private String buildMessage(ConfidenceLevel confidenceLevel) {
        return switch (confidenceLevel) {
            case HIGH_CONFIDENCE -> "Item identified with high confidence";
            case NEEDS_VERIFICATION -> "Item identified - manual verification recommended";
            case LOW_CONFIDENCE -> "Low confidence - please select from candidates or verify manually";
        };
    }

    private Item findItemForAudit(Object[] row) {
        Long itemId = ((Number) row[0]).longValue();
        return itemRepository.findById(itemId).orElse(null);
    }

    private ItemIdentificationResponse handleNoItemsFound(String identificationId,
                                                          User currentUser,
                                                          String originalFilename,
                                                          String ipAddress,
                                                          String userAgent) {
        logIdentification(currentUser, null, null, false,
                "No items with embeddings found in database",
                originalFilename, ipAddress, userAgent);

        return ItemIdentificationResponse.builder()
                .identificationId(identificationId)
                .itemId(null)
                .itemName(null)
                .barcode(null)
                .similarityScore(0.0)
                .confidentMatch(false)
                .confidenceLevel(ConfidenceLevel.LOW_CONFIDENCE)
                .needsVerification(false)
                .alertGenerated(false)
                .message("No items found in database for comparison")
                .candidates(List.of())
                .candidateCount(0)
                .excludedItemIds(List.of())
                .build();
    }

    private void logIdentification(User user, Item matchedItem, Double similarityScore,
                                   boolean success, String errorMessage,
                                   String originalFilename, String ipAddress, String userAgent) {
        AuditLog log = AuditLog.builder()
                .user(user)
                .actionType(AuditLog.ACTION_IMAGE_IDENTIFICATION)
                .matchedItem(matchedItem)
                .similarityScore(similarityScore)
                .success(success)
                .errorMessage(errorMessage)
                .originalFilename(originalFilename)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();

        auditLogRepository.save(log);
    }

    private void logMismatch(User user, Long rejectedItemId, List<Long> allExcludedIds,
                             String identificationId, String ipAddress, String userAgent) {
        AuditLog log = AuditLog.builder()
                .user(user)
                .actionType(AuditLog.ACTION_IMAGE_MISMATCH_FEEDBACK)
                .success(true)
                .details(String.format(
                        "{\"rejectedItemId\":%d,\"allExcludedIds\":%s,\"identificationId\":\"%s\"}",
                        rejectedItemId, allExcludedIds, identificationId))
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();

        auditLogRepository.save(log);
    }

    /**
     * Exception thrown when visual identification fails.
     */
    public static class VisualIdentificationException extends RuntimeException {
        public VisualIdentificationException(String message) {
            super(message);
        }

        public VisualIdentificationException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
