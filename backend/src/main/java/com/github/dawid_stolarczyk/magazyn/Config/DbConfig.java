package com.github.dawid_stolarczyk.magazyn.Config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.redis.repository.configuration.EnableRedisRepositories;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

/**
 * Database configuration class.
 * Handles initialization of PostgreSQL extensions and indexes required for the application.
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
@EnableJpaRepositories(basePackages = "com.github.dawid_stolarczyk.magazyn.Repositories.JPA")
@EnableRedisRepositories(basePackages = "com.github.dawid_stolarczyk.magazyn.Repositories.Redis")
public class DbConfig {

    private final DataSource dataSource;

    /**
     * Initializes PostgreSQL pgvector extension and creates optimized index for image similarity search.
     * This method runs once on application startup to ensure:
     * 1. The pgvector extension is enabled for vector operations
     * 2. An IVFFlat index exists on items.image_embedding for fast nearest-neighbor search
     *
     * <p>The IVFFlat index provides approximate nearest neighbor (ANN) search with:
     * - Clustering algorithm with 100 lists (recommended for small to medium datasets)
     * - Cosine distance operator
     * - Significantly faster queries than full table scans
     *
     * <p>Both operations are idempotent and safe to run multiple times.
     */
    @PostConstruct
    public void initializePgVector() {
        JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);
        try {
            String dbName = dataSource.getConnection().getMetaData().getDatabaseProductName();
            if ("PostgreSQL".equalsIgnoreCase(dbName)) {
                // Enable pgvector extension
                log.info("Initializing pgvector extension...");
                jdbcTemplate.execute("CREATE EXTENSION IF NOT EXISTS vector");
                log.info("pgvector extension initialized successfully");

                // Drop old unique partial index if it exists (without item_id)
                jdbcTemplate.execute(
                        "DROP INDEX IF EXISTS idx_unique_open_alert"
                );

                // Create unique partial index with item_id support
                log.info("Creating unique partial index for alert idempotency...");
                jdbcTemplate.execute(
                        "CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_open_alert " +
                                "ON alerts (rack_id, COALESCE(item_id, -1), alert_type, status) " +
                                "WHERE status IN ('OPEN', 'ACTIVE')"
                );
                log.info("Alert idempotency index created successfully");

                // Update alerts table to allow warehouse_id to be nullable
                log.info("Updating alerts.warehouse_id to be nullable...");
                try {
                    jdbcTemplate.execute("ALTER TABLE alerts ALTER COLUMN warehouse_id DROP NOT NULL");
                    log.info("warehouse_id nullable constraint updated successfully");
                } catch (Exception e) {
                    log.info("warehouse_id may already be nullable or error occurred: {}", e.getMessage());
                }

                // === Item Images: IVFFlat index for multi-image similarity search ===
                log.info("Creating IVFFlat index on item_images.image_embedding...");
                jdbcTemplate.execute(
                        "CREATE INDEX IF NOT EXISTS idx_item_images_embedding_cosine " +
                                "ON item_images USING ivfflat (image_embedding vector_cosine_ops) " +
                                "WITH (lists = 100)"
                );
                log.info("item_images IVFFlat index created successfully");

                // FK index for efficient item_id lookups
                jdbcTemplate.execute(
                        "CREATE INDEX IF NOT EXISTS idx_item_images_item_id ON item_images (item_id)"
                );

                // Unique partial index: only one primary image per item
                jdbcTemplate.execute(
                        "CREATE UNIQUE INDEX IF NOT EXISTS idx_item_images_one_primary " +
                                "ON item_images (item_id) WHERE is_primary = true"
                );

                // === Migration: copy existing item data to item_images ===
                migrateItemEmbeddingsToItemImages(jdbcTemplate);

                // Drop old items embedding index and column
                jdbcTemplate.execute("DROP INDEX IF EXISTS idx_items_image_embedding_cosine");
                try {
                    jdbcTemplate.execute("ALTER TABLE items DROP COLUMN IF EXISTS image_embedding");
                    log.info("Dropped old image_embedding column from items table");
                } catch (Exception e) {
                    log.info("image_embedding column may already be removed: {}", e.getMessage());
                }

                // Update alert_type check constraint to include ADMIN_MESSAGE
                log.info("Updating alert_type check constraint to include ADMIN_MESSAGE...");
                try {
                    jdbcTemplate.execute("ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_alert_type_check");
                    jdbcTemplate.execute(
                            "ALTER TABLE alerts ADD CONSTRAINT alerts_alert_type_check " +
                                    "CHECK (alert_type IN (" +
                                    "'WEIGHT_EXCEEDED', " +
                                    "'TEMPERATURE_TOO_HIGH', " +
                                    "'TEMPERATURE_TOO_LOW', " +
                                    "'LOW_VISUAL_SIMILARITY', " +
                                    "'ITEM_TEMPERATURE_TOO_HIGH', " +
                                    "'ITEM_TEMPERATURE_TOO_LOW', " +
                                    "'EMBEDDING_GENERATION_COMPLETED', " +
                                    "'EMBEDDING_GENERATION_FAILED', " +
                                    "'ASSORTMENT_EXPIRED', " +
                                    "'ASSORTMENT_CLOSE_TO_EXPIRY', " +
                                    "'BACKUP_COMPLETED', " +
                                    "'BACKUP_FAILED', " +
                                    "'ADMIN_MESSAGE'" +
                                    "))"
                    );
                    log.info("alert_type check constraint updated successfully");
                } catch (Exception e) {
                    log.info("alert_type check constraint may already be updated or error occurred: {}", e.getMessage());
                }
            } else {
                log.info("Skipping PostgreSQL-specific initialization for database: {}", dbName);
            }
        } catch (Exception e) {
            log.error("Failed to initialize database: {}. Ensure the database user has SUPERUSER or CREATE EXTENSION privileges.", e.getMessage(), e);
            throw new RuntimeException("Database initialization failed. Check database privileges.", e);
        }
    }

    /**
     * Migrates existing item photo_url and image_embedding data to item_images table.
     * Idempotent: only inserts for items that don't already have an item_image record.
     */
    private void migrateItemEmbeddingsToItemImages(JdbcTemplate jdbcTemplate) {
        try {
            // Check if items table still has image_embedding column
            boolean hasEmbeddingColumn = false;
            try {
                jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM information_schema.columns " +
                                "WHERE table_name = 'items' AND column_name = 'image_embedding'",
                        Integer.class);
                hasEmbeddingColumn = true;
            } catch (Exception e) {
                log.info("image_embedding column check failed, skipping migration: {}", e.getMessage());
            }

            if (!hasEmbeddingColumn) {
                log.info("No image_embedding column found on items, skipping migration");
                return;
            }

            // Migrate items with photo and embedding
            int migratedWithEmbedding = jdbcTemplate.update(
                    "INSERT INTO item_images (item_id, photo_url, image_embedding, is_primary, display_order, created_at) " +
                            "SELECT id, photo_url, image_embedding, true, 0, NOW() " +
                            "FROM items " +
                            "WHERE photo_url IS NOT NULL AND image_embedding IS NOT NULL " +
                            "AND id NOT IN (SELECT item_id FROM item_images)"
            );
            log.info("Migrated {} items with photo+embedding to item_images", migratedWithEmbedding);

            // Migrate items with photo but no embedding
            int migratedWithoutEmbedding = jdbcTemplate.update(
                    "INSERT INTO item_images (item_id, photo_url, is_primary, display_order, created_at) " +
                            "SELECT id, photo_url, true, 0, NOW() " +
                            "FROM items " +
                            "WHERE photo_url IS NOT NULL AND image_embedding IS NULL " +
                            "AND id NOT IN (SELECT item_id FROM item_images)"
            );
            log.info("Migrated {} items with photo only to item_images", migratedWithoutEmbedding);

        } catch (Exception e) {
            log.warn("Item images migration encountered an issue (may be safe to ignore): {}", e.getMessage());
        }
    }
}
