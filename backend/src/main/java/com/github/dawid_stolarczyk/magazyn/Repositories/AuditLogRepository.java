package com.github.dawid_stolarczyk.magazyn.Repositories;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

/**
 * Repository for audit log records.
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    /**
     * Find audit logs by user ID with pagination
     */
    Page<AuditLog> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /**
     * Find audit logs by action type
     */
    Page<AuditLog> findByActionTypeOrderByCreatedAtDesc(String actionType, Pageable pageable);

    /**
     * Find audit logs for a specific item
     */
    Page<AuditLog> findByMatchedItemIdOrderByCreatedAtDesc(Long itemId, Pageable pageable);

    /**
     * Find audit logs within a time range
     */
    List<AuditLog> findByCreatedAtBetweenOrderByCreatedAtDesc(Instant start, Instant end);

    /**
     * Find all audit logs with pagination, newest first
     */
    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /**
     * Count audit logs by action type
     */
    long countByActionType(String actionType);

    /**
     * Count successful operations by action type
     */
    long countByActionTypeAndSuccess(String actionType, boolean success);
}
