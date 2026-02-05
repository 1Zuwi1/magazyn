package com.github.dawid_stolarczyk.magazyn.Repositories.JPA;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.RackReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface RackReportRepository extends JpaRepository<RackReport, Long> {

    List<RackReport> findByRackIdOrderByCreatedAtDesc(Long rackId);

    Page<RackReport> findByRackId(Long rackId, Pageable pageable);

    @Query("SELECT r FROM RackReport r WHERE r.rack.id = :rackId AND r.createdAt BETWEEN :start AND :end ORDER BY r.createdAt DESC")
    List<RackReport> findByRackIdAndTimeRange(@Param("rackId") Long rackId, @Param("start") Instant start, @Param("end") Instant end);

    Page<RackReport> findByAlertTriggeredTrue(Pageable pageable);

    @Query("SELECT r FROM RackReport r WHERE r.rack.warehouse.id = :warehouseId ORDER BY r.createdAt DESC")
    Page<RackReport> findByWarehouseId(@Param("warehouseId") Long warehouseId, Pageable pageable);

    long countByRackId(Long rackId);

    @Query("SELECT r FROM RackReport r WHERE r.rack.id = :rackId ORDER BY r.createdAt DESC LIMIT 1")
    RackReport findLatestByRackId(@Param("rackId") Long rackId);
}
