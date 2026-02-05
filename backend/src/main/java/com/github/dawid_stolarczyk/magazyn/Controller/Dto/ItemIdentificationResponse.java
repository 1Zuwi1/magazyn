package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for visual item identification endpoint.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Visual identification result for an uploaded image")
public class ItemIdentificationResponse {

    @Schema(description = "ID of the matched item", example = "42")
    private Long itemId;

    @Schema(description = "Name of the matched item", example = "Laptop Dell XPS 15")
    private String itemName;

    @Schema(description = "Barcode of the matched item", example = "123456")
    private String barcode;

    @Schema(description = "Similarity score between 0.0 and 1.0 (1.0 = perfect match)", example = "0.95")
    private double similarityScore;

    @Schema(description = "Whether the match confidence is above the threshold", example = "true")
    private boolean confidentMatch;

    @Schema(description = "Alert generated if similarity is below threshold", example = "false")
    private boolean alertGenerated;

    @Schema(description = "Message providing additional context", example = "Item identified with high confidence")
    private String message;
}
