package com.github.dawid_stolarczyk.magazyn.Model.Entity;

import com.github.dawid_stolarczyk.magazyn.Model.Enums.ApiKeyScope;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.Set;

/**
 * Entity representing an API key for external system / IoT sensor access.
 * Only the SHA-256 hash of the key is stored; the raw key is shown once at creation.
 * <p>
 * SQL equivalent:
 * CREATE TABLE api_keys (
 * id BIGSERIAL PRIMARY KEY,
 * key_hash VARCHAR(64) NOT NULL UNIQUE,
 * key_prefix VARCHAR(8) NOT NULL,
 * name VARCHAR(100) NOT NULL,
 * warehouse_id BIGINT REFERENCES warehouses(id),
 * is_active BOOLEAN NOT NULL DEFAULT TRUE,
 * scopes TEXT NOT NULL,
 * created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
 * last_used_at TIMESTAMP WITH TIME ZONE,
 * created_by_user_id BIGINT NOT NULL REFERENCES users(id)
 * );
 * CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
 * CREATE INDEX idx_api_keys_warehouse_id ON api_keys(warehouse_id);
 */
@Entity
@Table(name = "api_keys", indexes = {
        @Index(name = "idx_api_keys_key_hash", columnList = "keyHash", unique = true),
        @Index(name = "idx_api_keys_warehouse_id", columnList = "warehouse_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiKey {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String keyHash;

    @Column(nullable = false, length = 8)
    private String keyPrefix;

    @Column(nullable = false, length = 100)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id")
    private Warehouse warehouse;

    @Column(nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @ElementCollection(targetClass = ApiKeyScope.class, fetch = FetchType.EAGER)
    @CollectionTable(name = "api_key_scopes", joinColumns = @JoinColumn(name = "api_key_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "scope")
    private Set<ApiKeyScope> scopes;

    @Column(nullable = false)
    private Instant createdAt;

    private Instant lastUsedAt;

    @Column(nullable = false)
    private Long createdByUserId;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public boolean hasScope(ApiKeyScope scope) {
        return scopes != null && scopes.contains(scope);
    }

    public Long getWarehouseId() {
        return warehouse != null ? warehouse.getId() : null;
    }
}
