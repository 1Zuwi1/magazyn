package com.github.dawid_stolarczyk.magazyn.Repositories.JPA;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.Item;
import com.github.dawid_stolarczyk.magazyn.Repositories.Projection.ItemSimilarityProjection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ItemRepository extends JpaRepository<Item, Long> {
    boolean existsByCode(String code);

    Optional<Item> findByCode(String code);

    Page<Item> findAll(Pageable pageable);

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
