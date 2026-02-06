package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A single candidate item from visual similarity search with full metadata and distance info.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "A candidate item from visual similarity search")
public class IdentificationCandidate {

    @Schema(description = "ID of the candidate item", example = "42")
    private Long itemId;

    @Schema(description = "Name of the candidate item", example = "Laptop Dell XPS 15")
    private String itemName;

    @Schema(description = "GS1-128 barcode code of the candidate item", example = "12345678901234")
    private String code;

    @Schema(description = "URL or path to the item's photo", example = "/api/items/42/photo")
    private String photoUrl;

    @Schema(description = "Weight of the item in kg", example = "1.5")
    private Float weight;

    @Schema(description = "Whether the item is dangerous", example = "false")
    private Boolean isDangerous;

    @Schema(description = "Raw cosine distance from pgvector (0 = identical, 2 = opposite)", example = "0.15")
    private double cosineDistance;

    @Schema(description = "Similarity score between 0.0 and 1.0 (1.0 = perfect match)", example = "0.925")
    private double similarityScore;

    @Schema(description = "Rank among candidates (1 = best match)", example = "1")
    private int rank;
}
