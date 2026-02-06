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
     * - Cosine distance operator (<=>)
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

                // Create IVFFlat index
                log.info("Creating IVFFlat index on items.image_embedding...");
                jdbcTemplate.execute(
                        "CREATE INDEX IF NOT EXISTS idx_items_image_embedding_cosine " +
                                "ON items USING ivfflat (image_embedding vector_cosine_ops) " +
                                "WITH (lists = 100)"
                );
                log.info("IVFFlat index created successfully");

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
            } else {
                log.info("Skipping PostgreSQL-specific initialization for database: {}", dbName);
            }
        } catch (Exception e) {
            log.error("Failed to initialize database: {}. Ensure the database user has SUPERUSER or CREATE EXTENSION privileges.", e.getMessage(), e);
            throw new RuntimeException("Database initialization failed. Check database privileges.", e);
        }
    }
}
