package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import com.github.dawid_stolarczyk.magazyn.Model.Enums.ConfidenceLevel;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for visual item identification endpoint.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Visual identification result for an uploaded image")
public class ItemIdentificationResponse {

    @Schema(description = "Identification session ID for use with mismatch feedback endpoint",
            example = "a1b2c3d4-e5f6-7890-abcd-ef1234567890")
    private String identificationId;

    @Schema(description = "ID of the matched item (null for LOW_CONFIDENCE)", example = "42")
    private Long itemId;

    @Schema(description = "Name of the matched item (null for LOW_CONFIDENCE)", example = "Laptop Dell XPS 15")
    private String itemName;

    @Schema(description = "Barcode of the matched item (null for LOW_CONFIDENCE)", example = "123456")
    private String barcode;

    @Schema(description = "Similarity score of the best match between 0.0 and 1.0", example = "0.95")
    private double similarityScore;

    @Schema(description = "Whether the match confidence is above the low threshold", example = "true")
    private boolean confidentMatch;

    @Schema(description = "Confidence level tier: HIGH_CONFIDENCE, NEEDS_VERIFICATION, or LOW_CONFIDENCE")
    private ConfidenceLevel confidenceLevel;

    @Schema(description = "Whether the match needs manual verification before acceptance", example = "false")
    private boolean needsVerification;

    @Schema(description = "Alert generated if similarity is below threshold", example = "false")
    private boolean alertGenerated;

    @Schema(description = "Message providing additional context", example = "Item identified with high confidence")
    private String message;

    @Schema(description = "List of candidate items ordered by similarity (best first)")
    private List<IdentificationCandidate> candidates;

    @Schema(description = "Total number of candidate items returned", example = "1")
    private int candidateCount;

    @Schema(description = "List of item IDs excluded from results (accumulated from mismatch rejections)")
    private List<Long> excludedItemIds;
}
