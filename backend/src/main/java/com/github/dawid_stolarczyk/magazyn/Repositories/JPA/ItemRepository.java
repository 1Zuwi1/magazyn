package com.github.dawid_stolarczyk.magazyn.Repositories.JPA;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.Item;
import com.github.dawid_stolarczyk.magazyn.Repositories.Projection.ItemSimilarityProjection;
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

    Page<Item> findAll(Pageable pageable);

    Page<Item> findByDangerousTrue(Pageable pageable);

    /**
     * Finds all distinct items that have assortments in a given warehouse.
     * Uses a single query with JOIN through Assortment → Rack → Warehouse.
     */
    @Query("SELECT DISTINCT a.item FROM Assortment a WHERE a.rack.warehouse.id = :warehouseId")
    List<Item> findDistinctByWarehouseId(@Param("warehouseId") Long warehouseId);

    /**
     * Finds items with embeddings that are most similar to the provided vector.
     * Uses PostgreSQL pgvector's cosine distance operator (the {@code <=>} operator).
     * Returns the item ID and cosine distance (0 = identical, 2 = opposite).
     *
     * @param embedding the query embedding as a formatted vector string "[0.1, 0.2, ...]"
     * @param limit     maximum number of results to return
     * @return list of ItemSimilarityProjection containing id and distance
     */
    @Query(value = "SELECT id, (image_embedding <=> CAST(:embedding AS vector)) as distance "
            + "FROM items "
            + "WHERE image_embedding IS NOT NULL "
            + "ORDER BY distance ASC "
            + "LIMIT :limit",
            nativeQuery = true)
    List<ItemSimilarityProjection> findMostSimilarByEmbedding(@Param("embedding") String embedding,
                                                              @Param("limit") int limit);

    /**
     * Finds the single most similar item to the provided embedding.
     *
     * @param embedding the query embedding as a formatted vector string "[0.1, 0.2, ...]"
     * @return List containing single ItemSimilarityProjection, or empty list if no items
     */
    @Query(value = "SELECT id, (image_embedding <=> CAST(:embedding AS vector)) as distance "
            + "FROM items "
            + "WHERE image_embedding IS NOT NULL "
            + "ORDER BY distance ASC "
            + "LIMIT 1",
            nativeQuery = true)
    List<ItemSimilarityProjection> findMostSimilar(@Param("embedding") String embedding);

    /**
     * Finds items most similar to the provided embedding, excluding specific item IDs.
     * Used by the mismatch/feedback flow to return alternatives after a rejected match.
     *
     * @param embedding   the query embedding as a formatted vector string "[0.1, 0.2, ...]"
     * @param excludedIds list of item IDs to exclude from results
     * @param limit       maximum number of results to return
     * @return list of ItemSimilarityProjection containing id and distance
     */
    @Query(value = "SELECT id, (image_embedding <=> CAST(:embedding AS vector)) as distance "
            + "FROM items "
            + "WHERE image_embedding IS NOT NULL "
            + "AND id NOT IN (:excludedIds) "
            + "ORDER BY distance ASC "
            + "LIMIT :limit",
            nativeQuery = true)
    List<ItemSimilarityProjection> findMostSimilarExcluding(@Param("embedding") String embedding,
                                                            @Param("excludedIds") List<Long> excludedIds,
                                                            @Param("limit") int limit);

}
