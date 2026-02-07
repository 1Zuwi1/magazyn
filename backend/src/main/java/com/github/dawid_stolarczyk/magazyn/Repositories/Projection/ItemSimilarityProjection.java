package com.github.dawid_stolarczyk.magazyn.Repositories.Projection;

/**
 * Projection interface for item similarity search results from pgvector queries.
 * Replaces raw Object[] arrays with a type-safe interface.
 */
public interface ItemSimilarityProjection {

    /**
     * Get the item ID
     */
    Long getId();

    /**
     * Get the cosine distance from the query embedding.
     * Range: 0 (identical) to 2 (opposite vectors)
     */
    Double getDistance();
}
