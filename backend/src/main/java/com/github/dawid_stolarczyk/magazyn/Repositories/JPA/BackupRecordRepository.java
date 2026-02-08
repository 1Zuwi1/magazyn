package com.github.dawid_stolarczyk.magazyn.Repositories.JPA;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.BackupRecord;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.BackupStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface BackupRecordRepository extends JpaRepository<BackupRecord, Long>, JpaSpecificationExecutor<BackupRecord> {

    boolean existsByWarehouseIdAndStatus(Long warehouseId, BackupStatus status);

    Page<BackupRecord> findByWarehouseId(Long warehouseId, Pageable pageable);
}
