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
     * Znajdź assortmenty dla danego produktu w kolejności FIFO (najstarsze najpierw)
     */
    @Query("SELECT a FROM Assortment a WHERE a.item.id = :itemId ORDER BY a.created_at ASC")
    List<Assortment> findByItemIdFifoOrdered(@Param("itemId") Long itemId);

    /**
     * Znajdź assortmenty starsze od podanego (te same item, wcześniejszy created_at)
     */
    @Query("SELECT a FROM Assortment a WHERE a.item.id = :itemId AND a.created_at < :createdAt ORDER BY a.created_at ASC")
    List<Assortment> findOlderAssortments(@Param("itemId") Long itemId, @Param("createdAt") Timestamp createdAt);

    /**
     * Znajdź assortment na konkretnej pozycji w regale
     */
    Optional<Assortment> findByRackIdAndPositionXAndPositionY(Long rackId, Integer positionX, Integer positionY);

    /**
     * Znajdź wszystkie assortmenty w danym magazynie z paginacją
     */
    Page<Assortment> findByRack_WarehouseId(Long warehouseId, Pageable pageable);
}
