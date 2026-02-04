package com.github.dawid_stolarczyk.magazyn.Repositories;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.Alert;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AlertStatus;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AlertType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {

    /**
     * Check if an active alert of the same type exists for a rack
     */
    @Query("SELECT COUNT(a) > 0 FROM Alert a WHERE a.rack.id = :rackId AND a.alertType = :alertType AND a.status IN :statuses")
    boolean existsActiveAlertForRack(
            @Param("rackId") Long rackId,
            @Param("alertType") AlertType alertType,
            @Param("statuses") List<AlertStatus> statuses
    );

    /**
     * Find active alert of specific type for a rack
     */
    @Query("SELECT a FROM Alert a WHERE a.rack.id = :rackId AND a.alertType = :alertType AND a.status IN :statuses")
    Optional<Alert> findActiveAlertForRack(
            @Param("rackId") Long rackId,
            @Param("alertType") AlertType alertType,
            @Param("statuses") List<AlertStatus> statuses
    );

    /**
     * Find all alerts with pagination
     */
    Page<Alert> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /**
     * Find alerts by status
     */
    Page<Alert> findByStatusOrderByCreatedAtDesc(AlertStatus status, Pageable pageable);

    /**
     * Find alerts by multiple statuses
     */
    Page<Alert> findByStatusInOrderByCreatedAtDesc(List<AlertStatus> statuses, Pageable pageable);

    /**
     * Find alerts for a specific warehouse
     */
    Page<Alert> findByWarehouseIdOrderByCreatedAtDesc(Long warehouseId, Pageable pageable);

    /**
     * Find alerts for a specific rack
     */
    Page<Alert> findByRackIdOrderByCreatedAtDesc(Long rackId, Pageable pageable);

    /**
     * Find alerts by type
     */
    Page<Alert> findByAlertTypeOrderByCreatedAtDesc(AlertType alertType, Pageable pageable);

    /**
     * Count alerts by status
     */
    long countByStatus(AlertStatus status);

    /**
     * Count unresolved alerts (OPEN or ACTIVE)
     */
    @Query("SELECT COUNT(a) FROM Alert a WHERE a.status IN ('OPEN', 'ACTIVE')")
    long countUnresolvedAlerts();

    /**
     * Count unresolved alerts for a warehouse
     */
    @Query("SELECT COUNT(a) FROM Alert a WHERE a.warehouse.id = :warehouseId AND a.status IN ('OPEN', 'ACTIVE')")
    long countUnresolvedAlertsByWarehouse(@Param("warehouseId") Long warehouseId);
}
