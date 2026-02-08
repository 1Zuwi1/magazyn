package com.github.dawid_stolarczyk.magazyn.Repositories.JPA;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.BackupSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BackupScheduleRepository extends JpaRepository<BackupSchedule, Long> {

    Optional<BackupSchedule> findByWarehouseId(Long warehouseId);

    List<BackupSchedule> findByEnabledTrue();

    void deleteByWarehouseId(Long warehouseId);
}
