package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssortmentDto {
    @Schema(description = "Unique identifier of the assortment", example = "1")
    private Long id;

    @Schema(
            description = "GS1-128 barcode (digits only) using AIs (11) YYMMDD, (01) GTIN-14, (21) serial",
            example = "11020126010000000000123421012345"
    )
    @Pattern(regexp = "\\d{32}", message = "BARCODE_MUST_BE_32_DIGITS")
    private String barcode;

    @NotNull
    @Schema(description = "ID of the item", example = "1")
    private Long itemId;

    @NotNull
    @Schema(description = "ID of the rack", example = "1")
    private Long rackId;

    @Schema(description = "ID of the user who created this placement", example = "1")
    private Long userId;

    @Schema(description = "Creation timestamp")
    private Timestamp createdAt;

    @Schema(description = "Expiration timestamp")
    private Timestamp expiresAt;

    @Min(0)
    @Schema(description = "X position in the rack", example = "1")
    private Integer positionX;

    @Min(0)
    @Schema(description = "Y position in the rack", example = "1")
    private Integer positionY;
}
