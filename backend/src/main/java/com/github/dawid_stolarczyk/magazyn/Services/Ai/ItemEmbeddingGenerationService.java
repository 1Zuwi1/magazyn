package com.github.dawid_stolarczyk.magazyn.Services.Ai;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.Item;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.ItemRepository;
import com.github.dawid_stolarczyk.magazyn.Services.Storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

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

    /**
     * Generates embeddings for all items that have photos but no embeddings.
     *
     * @return report with statistics of the generation process
     */
    @Transactional
    public EmbeddingGenerationReport generateMissingEmbeddings() {
        log.info("Starting batch embedding generation for items without embeddings");

        // Find all items with photos but without embeddings
        List<Item> itemsWithoutEmbeddings = itemRepository.findAll().stream()
                .filter(item -> item.getPhoto_url() != null && !item.getPhoto_url().isBlank())
                .filter(item -> item.getImageEmbedding() == null)
                .toList();

        if (itemsWithoutEmbeddings.isEmpty()) {
            log.info("No items found that need embedding generation");
            return EmbeddingGenerationReport.builder()
                    .totalItems(0)
                    .processed(0)
                    .successful(0)
                    .failed(0)
                    .skipped(0)
                    .build();
        }

        log.info("Found {} items without embeddings", itemsWithoutEmbeddings.size());

        AtomicInteger processed = new AtomicInteger(0);
        AtomicInteger successful = new AtomicInteger(0);
        AtomicInteger failed = new AtomicInteger(0);

        for (Item item : itemsWithoutEmbeddings) {
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
                    log.info("Progress: {}/{} items processed", processed.get(), itemsWithoutEmbeddings.size());
                }
            }
        }

        EmbeddingGenerationReport report = EmbeddingGenerationReport.builder()
                .totalItems(itemsWithoutEmbeddings.size())
                .processed(processed.get())
                .successful(successful.get())
                .failed(failed.get())
                .skipped(0)
                .build();

        log.info("Embedding generation completed: {}", report);
        return report;
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
