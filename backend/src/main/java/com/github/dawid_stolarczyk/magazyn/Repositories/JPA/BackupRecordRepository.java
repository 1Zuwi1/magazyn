package com.github.dawid_stolarczyk.magazyn.Repositories.JPA;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.BackupRecord;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.BackupStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface BackupRecordRepository extends JpaRepository<BackupRecord, Long>, JpaSpecificationExecutor<BackupRecord> {

    boolean existsByWarehouseIdAndStatus(Long warehouseId, BackupStatus status);

    Page<BackupRecord> findByWarehouseId(Long warehouseId, Pageable pageable);

    List<BackupRecord> findByStatusAndCreatedAtBefore(BackupStatus status, Instant createdAt);

    List<BackupRecord> findByWarehouseIdAndStatusOrderByCompletedAtDesc(Long warehouseId, BackupStatus status);

    @Query("SELECT b FROM BackupRecord b LEFT JOIN FETCH b.warehouse w LEFT JOIN FETCH b.triggeredBy u WHERE b.id = :id")
    Optional<BackupRecord> findWithEagerById(@Param("id") Long id);

    @Query("SELECT b FROM BackupRecord b LEFT JOIN FETCH b.warehouse w LEFT JOIN FETCH b.triggeredBy u")
    Page<BackupRecord> findAllWithEager(Pageable pageable);

    @Modifying
    @Query("DELETE FROM BackupRecord b WHERE b.status IN :statuses AND b.completedAt < :cutoffDate")
    int deleteByStatusInAndCompletedAtBefore(@Param("statuses") List<BackupStatus> statuses, @Param("cutoffDate") Instant cutoffDate);
}
