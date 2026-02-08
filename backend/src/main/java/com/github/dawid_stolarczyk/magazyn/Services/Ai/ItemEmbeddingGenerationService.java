package com.github.dawid_stolarczyk.magazyn.Services.Ai;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.Alert;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Item;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.UserNotification;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AccountStatus;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AlertStatus;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AlertType;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.UserRole;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.AlertRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.ItemRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.UserNotificationRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.UserRepository;
import com.github.dawid_stolarczyk.magazyn.Services.Storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

/**
 * Service for batch generating image embeddings for existing items.
 * Processes items that have photos but no embeddings.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ItemEmbeddingGenerationService {

    private final ItemRepository itemRepository;
    private final ImageEmbeddingService imageEmbeddingService;
    private final StorageService storageService;
    private final AlertRepository alertRepository;
    private final UserRepository userRepository;
    private final UserNotificationRepository userNotificationRepository;

    /**
     * Generates embeddings for all items that have photos but no embeddings.
     *
     * @return report with statistics of the generation process
     */
    @Transactional
    public EmbeddingGenerationReport generateMissingEmbeddings() {
        return generateEmbeddings(false);
    }

    /**
     * Generates embeddings for items with photos asynchronously.
     * When forceRegenerate is true, regenerates embeddings for ALL items with photos.
     * When false, only processes items that don't have embeddings yet.
     *
     * @param forceRegenerate if true, regenerate all embeddings
     */
    @Async
    @Transactional
    public void generateEmbeddingsAsync(boolean forceRegenerate) {
        EmbeddingGenerationReport report = generateEmbeddingsInternal(forceRegenerate);
        log.info("✓ Embedding generation COMPLETED: {}", report);

        // Create system alert for admins
        createSystemAlert(report);
    }

    /**
     * Generates embeddings for items with photos synchronously.
     * When forceRegenerate is true, regenerates embeddings for ALL items with photos.
     * When false, only processes items that don't have embeddings yet.
     *
     * @param forceRegenerate if true, regenerate all embeddings
     * @return report with statistics of the generation process
     */
    @Transactional
    public EmbeddingGenerationReport generateEmbeddings(boolean forceRegenerate) {
        return generateEmbeddingsInternal(forceRegenerate);
    }

    private EmbeddingGenerationReport generateEmbeddingsInternal(boolean forceRegenerate) {
        log.info("Starting batch embedding generation (forceRegenerate={})", forceRegenerate);

        List<Item> itemsToProcess = itemRepository.findAll().stream()
                .filter(item -> item.getPhoto_url() != null && !item.getPhoto_url().isBlank())
                .filter(item -> forceRegenerate || item.getImageEmbedding() == null)
                .toList();

        if (itemsToProcess.isEmpty()) {
            log.info("No items found that need embedding generation");
            return EmbeddingGenerationReport.builder()
                    .totalItems(0)
                    .processed(0)
                    .successful(0)
                    .failed(0)
                    .skipped(0)
                    .build();
        }

        log.info("Found {} items to process", itemsToProcess.size());

        AtomicInteger processed = new AtomicInteger(0);
        AtomicInteger successful = new AtomicInteger(0);
        AtomicInteger failed = new AtomicInteger(0);

        for (Item item : itemsToProcess) {
            InputStream photoStream = null;
            try {
                // Download photo from S3
                photoStream = storageService.download(item.getPhoto_url());

                // Generate embedding
                float[] embedding = imageEmbeddingService.getEmbedding(photoStream);

                // Save embedding to database
                item.setImageEmbedding(embedding);
                itemRepository.save(item);

                successful.incrementAndGet();
                log.debug("Generated embedding for item {} ({})", item.getId(), item.getName());

            } catch (Exception e) {
                failed.incrementAndGet();
                log.error("Failed to generate embedding for item {} ({}): {}",
                        item.getId(), item.getName(), e.getMessage());
            } finally {
                // Close the input stream to release HTTP connection
                if (photoStream != null) {
                    try {
                        photoStream.close();
                    } catch (Exception e) {
                        log.warn("Failed to close photo stream for item {}", item.getId());
                    }
                }

                processed.incrementAndGet();

                // Log progress every 10 items
                if (processed.get() % 10 == 0) {
                    log.info("Progress: {}/{} items processed", processed.get(), itemsToProcess.size());
                }
            }
        }

        EmbeddingGenerationReport report = EmbeddingGenerationReport.builder()
                .totalItems(itemsToProcess.size())
                .processed(processed.get())
                .successful(successful.get())
                .failed(failed.get())
                .skipped(0)
                .build();

        log.info("Embedding generation completed: {}", report);
        return report;
    }

    /**
     * Creates a system-wide alert for admins about embedding generation completion.
     * Alert has no rack/warehouse association (system-level notification).
     */
    private void createSystemAlert(EmbeddingGenerationReport report) {
        try {
            AlertType alertType = report.getFailed() > 0
                    ? AlertType.EMBEDDING_GENERATION_FAILED
                    : AlertType.EMBEDDING_GENERATION_COMPLETED;

            String message = String.format(
                    "Generowanie embeddingów zakończone: %d/%d produktów pomyślnie, %d błędów",
                    report.getSuccessful(), report.getTotalItems(), report.getFailed()
            );

            Alert alert = Alert.builder()
                    .rack(null)  // System-wide alert
                    .warehouse(null)  // System-wide alert
                    .triggeringReport(null)
                    .item(null)
                    .alertType(alertType)
                    .status(AlertStatus.OPEN)
                    .message(message)
                    .thresholdValue(null)
                    .actualValue((float) report.getSuccessful())
                    .createdAt(Instant.now())
                    .build();

            alertRepository.save(alert);
            log.info("Created system alert: type={}, message={}", alertType, message);

            // Distribute notifications to all ADMIN users
            distributeNotificationsToAdmins(alert);

        } catch (Exception e) {
            log.error("Failed to create system alert for embedding generation", e);
        }
    }

    /**
     * Distributes notifications for a system alert to all active admin users.
     */
    private void distributeNotificationsToAdmins(Alert alert) {
        List<User> adminUsers = userRepository.findByRoleAndStatus(UserRole.ADMIN, AccountStatus.ACTIVE);

        if (adminUsers.isEmpty()) {
            log.warn("No active admin users found to notify about system alert");
            return;
        }

        Instant now = Instant.now();
        List<UserNotification> notifications = adminUsers.stream()
                .map(user -> UserNotification.builder()
                        .user(user)
                        .alert(alert)
                        .isRead(false)
                        .createdAt(now)
                        .build())
                .collect(Collectors.toList());

        userNotificationRepository.saveAll(notifications);
        log.info("Distributed system alert to {} admin users", adminUsers.size());
    }

    /**
     * Report DTO for embedding generation results.
     */
    @lombok.Data
    @lombok.Builder
    @lombok.AllArgsConstructor
    @lombok.NoArgsConstructor
    public static class EmbeddingGenerationReport {
        private int totalItems;
        private int processed;
        private int successful;
        private int failed;
        private int skipped;

        @Override
        public String toString() {
            return String.format("total=%d, processed=%d, successful=%d, failed=%d, skipped=%d",
                    totalItems, processed, successful, failed, skipped);
        }
    }
}
