package com.github.dawid_stolarczyk.magazyn.Services.Ai;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ItemIdentificationResponse;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.AuditLog;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Item;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Repositories.AuditLogRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.ItemRepository;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.RateLimitOperation;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;

import static com.github.dawid_stolarczyk.magazyn.Utils.InternetUtils.getClientIp;

/**
 * Service for visual item identification using image similarity.
 * Converts uploaded images to embeddings and finds the most similar item in the database.
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

    /**
     * Similarity threshold below which an alert is generated.
     * Default: 0.7 (70% similarity)
     */
    @Value("${app.visual-identification.threshold:0.7}")
    private double similarityThreshold;

    /**
     * Identifies an item from an uploaded image.
     *
     * @param file the image file to identify
     * @param currentUser the user performing the identification (may be null)
     * @param request the HTTP request for rate limiting and audit logging
     * @return identification result with item details and similarity score
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

            // Find the most similar item
            Optional<Object[]> result = itemRepository.findMostSimilar(embeddingStr);

            if (result.isEmpty()) {
                return handleNoItemsFound(currentUser, originalFilename, ipAddress, userAgent);
            }

            Object[] row = result.get();
            Long itemId = ((Number) row[0]).longValue();
            double distance = ((Number) row[1]).doubleValue();
            double similarityScore = imageEmbeddingService.distanceToSimilarityScore(distance);

            Item matchedItem = itemRepository.findById(itemId).orElse(null);
            if (matchedItem == null) {
                return handleNoItemsFound(currentUser, originalFilename, ipAddress, userAgent);
            }

            boolean confidentMatch = similarityScore >= similarityThreshold;
            boolean alertGenerated = false;

            // Generate alert if similarity is below threshold
            if (!confidentMatch) {
                alertGenerated = alertService.createLowSimilarityAlertIfNeeded(
                        matchedItem, similarityScore, similarityThreshold, currentUser);
            }

            // Log the successful identification
            logIdentification(currentUser, matchedItem, similarityScore, true, null,
                    originalFilename, ipAddress, userAgent);

            return ItemIdentificationResponse.builder()
                    .itemId(matchedItem.getId())
                    .itemName(matchedItem.getName())
                    .barcode(matchedItem.getBarcode())
                    .similarityScore(similarityScore)
                    .confidentMatch(confidentMatch)
                    .alertGenerated(alertGenerated)
                    .message(confidentMatch
                            ? "Item identified with high confidence"
                            : "Item identified with low confidence - manual verification recommended")
                    .build();

        } catch (ImageEmbeddingService.ImageEmbeddingException e) {
            log.warn("Image embedding failed: {}", e.getMessage());
            logIdentification(currentUser, null, null, false, e.getMessage(),
                    originalFilename, ipAddress, userAgent);
            throw new VisualIdentificationException("Failed to process image: " + e.getMessage(), e);
        }
    }

    private ItemIdentificationResponse handleNoItemsFound(User currentUser, String originalFilename,
                                                          String ipAddress, String userAgent) {
        logIdentification(currentUser, null, null, false,
                "No items with embeddings found in database",
                originalFilename, ipAddress, userAgent);

        return ItemIdentificationResponse.builder()
                .itemId(null)
                .itemName(null)
                .barcode(null)
                .similarityScore(0.0)
                .confidentMatch(false)
                .alertGenerated(false)
                .message("No items found in database for comparison")
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
