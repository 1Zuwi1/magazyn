package com.github.dawid_stolarczyk.magazyn.Repositories.JPA;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.Assortment;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.RackReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface AssortmentRepository extends JpaRepository<Assortment, Long>, JpaSpecificationExecutor<Assortment> {
    List<Assortment> findByRackId(Long rackId);

    Page<Assortment> findByRackId(Long rackId, Pageable pageable);

    boolean existsByCode(String code);

    Optional<Assortment> findByCode(String code);

    long countByRack_WarehouseId(Long warehouseId);

    long countByRackId(Long rackId);

    Page<Assortment> findAll(Pageable pageable);

    /**
     * Batch count assortments by warehouse IDs to avoid N+1 queries
     */
    @Query("SELECT a.rack.warehouse.id, COUNT(a) FROM Assortment a WHERE a.rack.warehouse.id IN :warehouseIds GROUP BY a.rack.warehouse.id")
    Map<Long, Long> countByRack_WarehouseIdIn(@Param("warehouseIds") Iterable<Long> warehouseIds);

    /**
     * Znajdź assortmenty dla danego produktu w kolejności FIFO (najstarsze najpierw).
     * Wyklucza wygasłe assortmenty (expires_at <= NOW()).
     * Assortmenty bez daty wygaśnięcia (expires_at IS NULL) są uwzględniane.
     */
    @Query("SELECT a FROM Assortment a WHERE a.item.id = :itemId " +
            "AND (a.expiresAt IS NULL OR a.expiresAt > CURRENT_TIMESTAMP) " +
            "ORDER BY a.createdAt ASC")
    List<Assortment> findByItemIdFifoOrdered(@Param("itemId") Long itemId);

    /**
     * Znajdź assortmenty starsze od podanego (te same item, wcześniejszy created_at).
     * Wyklucza wygasłe assortmenty (expires_at <= NOW()).
     * Assortmenty bez daty wygaśnięcia (expires_at IS NULL) są uwzględniane.
     */
    @Query("SELECT a FROM Assortment a WHERE a.item.id = :itemId " +
            "AND a.createdAt < :createdAt " +
            "AND (a.expiresAt IS NULL OR a.expiresAt > CURRENT_TIMESTAMP) " +
            "ORDER BY a.createdAt ASC")
    List<Assortment> findOlderAssortments(@Param("itemId") Long itemId, @Param("createdAt") Timestamp createdAt);

    /**
     * Znajdź assortment na konkretnej pozycji w regale
     */
    Optional<Assortment> findByRackIdAndPositionXAndPositionY(Long rackId, Integer positionX, Integer positionY);

    /**
     * Znajdź wszystkie assortmenty w danym magazynie z paginacją
     */
    Page<Assortment> findByRack_WarehouseId(Long warehouseId, Pageable pageable);

    /**
     * Znajdź wygasłe assortmenty dla danego produktu (expires_at <= NOW()).
     * Używane do raportowania i alertowania o wygasłych produktach.
     */
    @Query("SELECT a FROM Assortment a WHERE a.item.id = :itemId " +
            "AND a.expiresAt IS NOT NULL AND a.expiresAt <= CURRENT_TIMESTAMP " +
            "ORDER BY a.expiresAt ASC")
    List<Assortment> findExpiredByItemId(@Param("itemId") Long itemId);

    /**
     * Policz dostępne (niewygasłe) assortmenty dla danego produktu.
     */
    @Query("SELECT COUNT(a) FROM Assortment a WHERE a.item.id = :itemId " +
            "AND (a.expiresAt IS NULL OR a.expiresAt > CURRENT_TIMESTAMP)")
    long countAvailableByItemId(@Param("itemId") Long itemId);

    /**
     * Znajdź wszystkie wygasłe assortmenty (expires_at <= NOW()).
     */
    @Query("SELECT a FROM Assortment a WHERE a.expiresAt IS NOT NULL AND a.expiresAt <= CURRENT_TIMESTAMP")
    List<Assortment> findAllExpired();

    /**
     * Znajdź assortmenty bliskie wygaśnięcia (expires_at > NOW() AND expires_at <= threshold).
     */
    @Query("SELECT a FROM Assortment a WHERE a.expiresAt IS NOT NULL " +
            "AND a.expiresAt > CURRENT_TIMESTAMP AND a.expiresAt <= :threshold")
    List<Assortment> findAllCloseToExpiry(@Param("threshold") Timestamp threshold);

    List<Assortment> findByUserId(Long userId);

    /**
     * Find assortments expiring before the given threshold, optionally filtered by warehouse.
     * Includes already expired assortments (expiresAt <= NOW()) and close-to-expiry.
     * JOIN FETCH item, rack, and warehouse for report generation.
     */
    @Query("SELECT a FROM Assortment a JOIN FETCH a.item JOIN FETCH a.rack r JOIN FETCH r.warehouse " +
            "WHERE a.expiresAt IS NOT NULL AND a.expiresAt <= :threshold " +
            "AND (:warehouseId IS NULL OR r.warehouse.id = :warehouseId) " +
            "ORDER BY a.expiresAt ASC")
    List<Assortment> findAllExpiringBefore(@Param("threshold") Timestamp threshold,
                                           @Param("warehouseId") Long warehouseId);

    /**
     * Find all assortments for inventory report, optionally filtered by warehouse.
     * JOIN FETCH item, rack, and warehouse for report generation.
     */
    @Query("SELECT a FROM Assortment a JOIN FETCH a.item JOIN FETCH a.rack r JOIN FETCH r.warehouse " +
            "WHERE (:warehouseId IS NULL OR r.warehouse.id = :warehouseId) " +
            "ORDER BY r.warehouse.name, r.marker, a.item.name")
    List<Assortment> findAllForInventoryReport(@Param("warehouseId") Long warehouseId);

    @Query(value = "SELECT r.* FROM rack_reports r " +
            "JOIN racks rk ON rk.id = r.rack_id " +
            "JOIN warehouses w ON w.id = rk.warehouse_id " +
            "JOIN assortment a ON a.rack_id = rk.id " +
            "WHERE r.alert_triggered = true " +
            "AND (CAST(:warehouseId AS BIGINT) IS NULL OR w.id = :warehouseId) " +
            "AND (CAST(:startTime AS TIMESTAMP WITH TIME ZONE) IS NULL OR r.created_at >= :startTime) " +
            "AND (CAST(:endTime AS TIMESTAMP WITH TIME ZONE) IS NULL OR r.created_at <= :endTime) " +
            "ORDER BY r.created_at DESC", nativeQuery = true)
    List<RackReport> findAlertTriggeredReports(@Param("warehouseId") Long warehouseId,
                                               @Param("startTime") Instant startTime,
                                               @Param("endTime") Instant endTime);
}

