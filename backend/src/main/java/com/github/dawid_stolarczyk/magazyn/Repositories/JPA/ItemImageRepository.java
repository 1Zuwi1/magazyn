package com.github.dawid_stolarczyk.magazyn.Repositories.JPA;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.ItemImage;
import com.github.dawid_stolarczyk.magazyn.Repositories.Projection.ItemSimilarityProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ItemImageRepository extends JpaRepository<ItemImage, Long> {

    List<ItemImage> findByItemIdOrderByDisplayOrderAsc(Long itemId);

    Optional<ItemImage> findByItemIdAndIsPrimaryTrue(Long itemId);

    int countByItemId(Long itemId);

    @Modifying
    @Query("UPDATE ItemImage ii SET ii.isPrimary = false WHERE ii.item.id = :itemId")
    void clearPrimaryForItem(@Param("itemId") Long itemId);

    @Query("SELECT COALESCE(MAX(ii.displayOrder), -1) + 1 FROM ItemImage ii WHERE ii.item.id = :itemId")
    int getNextDisplayOrder(@Param("itemId") Long itemId);

    @Query("SELECT ii FROM ItemImage ii WHERE ii.photoUrl IS NOT NULL AND ii.imageEmbedding IS NULL")
    List<ItemImage> findWithoutEmbedding();

    @Query("SELECT ii FROM ItemImage ii WHERE ii.photoUrl IS NOT NULL")
    List<ItemImage> findAllWithPhotos();

    List<ItemImage> findByItemId(Long itemId);

    /**
     * Finds the best (minimum distance) match per item across all item images.
     * Uses a subquery to first find the closest images, then groups by item_id
     * to return only the best match per item.
     */
    @Query(value = "SELECT item_id AS id, MIN(distance) AS distance FROM ("
            + "  SELECT item_id, (image_embedding <=> CAST(:embedding AS vector)) AS distance"
            + "  FROM item_images WHERE image_embedding IS NOT NULL"
            + "  ORDER BY distance ASC LIMIT :innerLimit"
            + ") sub GROUP BY item_id ORDER BY distance ASC LIMIT :outerLimit",
            nativeQuery = true)
    List<ItemSimilarityProjection> findBestMatchPerItem(@Param("embedding") String embedding,
                                                        @Param("innerLimit") int innerLimit,
                                                        @Param("outerLimit") int outerLimit);

    /**
     * Finds the best match per item, excluding specific item IDs.
     */
    @Query(value = "SELECT item_id AS id, MIN(distance) AS distance FROM ("
            + "  SELECT item_id, (image_embedding <=> CAST(:embedding AS vector)) AS distance"
            + "  FROM item_images WHERE image_embedding IS NOT NULL"
            + "  AND item_id NOT IN (:excludedIds)"
            + "  ORDER BY distance ASC LIMIT :innerLimit"
            + ") sub GROUP BY item_id ORDER BY distance ASC LIMIT :outerLimit",
            nativeQuery = true)
    List<ItemSimilarityProjection> findBestMatchPerItemExcluding(@Param("embedding") String embedding,
                                                                 @Param("excludedIds") List<Long> excludedIds,
                                                                 @Param("innerLimit") int innerLimit,
                                                                 @Param("outerLimit") int outerLimit);
}
