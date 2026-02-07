package com.github.dawid_stolarczyk.magazyn.Repositories.JPA;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.Assortment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

public interface AssortmentRepository extends JpaRepository<Assortment, Long> {
    List<Assortment> findByRackId(Long rackId);

    Page<Assortment> findByRackId(Long rackId, Pageable pageable);

    boolean existsByCode(String code);

    Optional<Assortment> findByCode(String code);

    long countByRack_WarehouseId(Long warehouseId);

    Page<Assortment> findAll(Pageable pageable);

    /**
     * Znajdź assortmenty dla danego produktu w kolejności FIFO (najstarsze najpierw).
     * Wyklucza wygasłe assortmenty (expires_at <= NOW()).
     * Assortmenty bez daty wygaśnięcia (expires_at IS NULL) są uwzględniane.
     */
    @Query("SELECT a FROM Assortment a WHERE a.item.id = :itemId " +
            "AND (a.expires_at IS NULL OR a.expires_at > CURRENT_TIMESTAMP) " +
            "ORDER BY a.created_at ASC")
    List<Assortment> findByItemIdFifoOrdered(@Param("itemId") Long itemId);

    /**
     * Znajdź assortmenty starsze od podanego (te same item, wcześniejszy created_at).
     * Wyklucza wygasłe assortmenty (expires_at <= NOW()).
     * Assortmenty bez daty wygaśnięcia (expires_at IS NULL) są uwzględniane.
     */
    @Query("SELECT a FROM Assortment a WHERE a.item.id = :itemId " +
            "AND a.created_at < :createdAt " +
            "AND (a.expires_at IS NULL OR a.expires_at > CURRENT_TIMESTAMP) " +
            "ORDER BY a.created_at ASC")
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
            "AND a.expires_at IS NOT NULL AND a.expires_at <= CURRENT_TIMESTAMP " +
            "ORDER BY a.expires_at ASC")
    List<Assortment> findExpiredByItemId(@Param("itemId") Long itemId);

    /**
     * Policz dostępne (niewygasłe) assortmenty dla danego produktu.
     */
    @Query("SELECT COUNT(a) FROM Assortment a WHERE a.item.id = :itemId " +
            "AND (a.expires_at IS NULL OR a.expires_at > CURRENT_TIMESTAMP)")
    long countAvailableByItemId(@Param("itemId") Long itemId);
}
