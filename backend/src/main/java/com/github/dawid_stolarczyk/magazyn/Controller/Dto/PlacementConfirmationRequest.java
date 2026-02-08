package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Getter
@Setter
public class PlacementConfirmationRequest {
    @Schema(description = "Item ID (required if code not provided)", example = "1")
    private Long itemId;

    @Schema(description = "Item code - GS1-128 barcode, 14 digits (required if itemId not provided)", example = "12345678901234")
    @Pattern(regexp = "\\d{14}", message = "BARCODE_MUST_BE_14_DIGITS")
    private String code;

    @NotEmpty
    @Size(max = 1000)
    @Valid
    private List<PlacementSlotRequest> placements;

    /**
     * Custom validation: either itemId or code must be provided, but not both.
     */
    public void validate() {
        boolean hasItemId = itemId != null;
        boolean hasCode = code != null && !code.isBlank();

        if (!hasItemId && !hasCode) {
            throw new IllegalArgumentException("Either itemId or code must be provided");
        }

        if (hasItemId && hasCode) {
            throw new IllegalArgumentException("Cannot provide both itemId and code");
        }
    }
}
