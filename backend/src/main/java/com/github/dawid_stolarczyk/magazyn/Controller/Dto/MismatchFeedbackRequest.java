package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for rejecting a visual identification match and requesting alternatives.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to reject a visual identification match and get alternatives")
public class MismatchFeedbackRequest {

    @NotNull
    @Schema(description = "Identification session ID from the original /identify response",
            example = "a1b2c3d4-e5f6-7890-abcd-ef1234567890")
    private String identificationId;

    @NotNull
    @Schema(description = "ID of the rejected item", example = "42")
    private Long rejectedItemId;
}
