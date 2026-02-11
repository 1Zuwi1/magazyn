package com.github.dawid_stolarczyk.magazyn.Repositories.JPA;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.ApiKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface ApiKeyRepository extends JpaRepository<ApiKey, Long> {

    Optional<ApiKey> findByKeyHash(String keyHash);

    List<ApiKey> findByIsActiveTrue();

    List<ApiKey> findByWarehouseId(Long warehouseId);

    boolean existsByName(String name);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE ApiKey a SET a.lastUsedAt = :timestamp WHERE a.id = :apiKeyId")
    void updateLastUsedAt(@Param("apiKeyId") Long apiKeyId, @Param("timestamp") Instant timestamp);

    @Modifying(clearAutomatically = true)
    @Query(nativeQuery = true, value = """
        UPDATE api_keys 
        SET last_used_at = CASE id 
            #{#updates.entrySet().stream()
                .map(entry -> 'WHEN ' + entry.key + ' THEN ''' + entry.value + '''')
                .collect(java.util.stream.Collectors.joining(' '))
            }
            ELSE last_used_at 
        END 
        WHERE id IN (#{#updates.keySet().stream().map(String::valueOf).collect(java.util.stream.Collectors.joining(','))})
        """)
    void bulkUpdateLastUsedAt(@Param("updates") Map<Long, Instant> updates);
}
