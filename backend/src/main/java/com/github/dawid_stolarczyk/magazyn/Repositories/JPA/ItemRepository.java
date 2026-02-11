package com.github.dawid_stolarczyk.magazyn.Repositories.JPA;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.Item;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ItemRepository extends JpaRepository<Item, Long>, JpaSpecificationExecutor<Item> {
    boolean existsByCode(String code);

    boolean existsByQrCode(String qrCode);

    Optional<Item> findByCode(String code);

    Optional<Item> findByQrCode(String qrCode);

    @Query("SELECT i FROM Item i WHERE i.code = :identifier OR i.qrCode = :identifier")
    Optional<Item> findByCodeOrQrCode(@Param("identifier") String identifier);

    @Query("SELECT i FROM Item i WHERE i.photo_url = :photoUrl")
    Optional<Item> findByPhoto_url(@Param("photoUrl") String photoUrl);

    @Query("SELECT COUNT(i) > 0 FROM Item i WHERE i.photo_url = :photoUrl")
    boolean existsByPhotoUrl(@Param("photoUrl") String photoUrl);

    Page<Item> findAll(Pageable pageable);

    Page<Item> findByDangerousTrue(Pageable pageable);

    /**
     * Finds all distinct items that have assortments in a given warehouse.
     * Uses a single query with JOIN through Assortment → Rack → Warehouse.
     */
    @Query("SELECT DISTINCT a.item FROM Assortment a WHERE a.rack.warehouse.id = :warehouseId")
    List<Item> findDistinctByWarehouseId(@Param("warehouseId") Long warehouseId);

    @Query("SELECT DISTINCT a.item FROM Assortment a JOIN FETCH a.item.images WHERE a.rack.warehouse.id = :warehouseId")
    List<Item> findDistinctByWarehouseIdWithImages(@Param("warehouseId") Long warehouseId);

}
