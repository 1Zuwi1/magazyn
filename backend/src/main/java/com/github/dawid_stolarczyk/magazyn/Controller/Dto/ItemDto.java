package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemDto {
    @Schema(description = "Unique identifier of the item", example = "1")
    private Long id;

    @Schema(description = "Unique barcode for the item", example = "123456")
    @Pattern(regexp = "\\d{6}", message = "BARCODE_MUST_BE_6_DIGITS")
    private String barcode;

    @NotBlank
    @Size(min = 2, max = 255)
    @Schema(description = "Name of the item", example = "Laptop")
    private String name;

    @Schema(description = "URL or path to the item's photo", example = "/api/items/1/photo")
    private String photoUrl;

    @DecimalMin("-273.15")
    @Schema(description = "Minimum temperature requirement", example = "5.0")
    private float minTemp;

    @DecimalMin("-273.15")
    @Schema(description = "Maximum temperature requirement", example = "25.0")
    private float maxTemp;

    @DecimalMin("0.0")
    @Schema(description = "Weight of the item", example = "1.5")
    private float weight;

    @DecimalMin("0.0")
    @Schema(description = "Width of the item", example = "0.5")
    private float sizeX;

    @DecimalMin("0.0")
    @Schema(description = "Height of the item", example = "0.3")
    private float sizeY;

    @DecimalMin("0.0")
    @Schema(description = "Depth of the item", example = "0.2")
    private float sizeZ;

    @Size(max = 1000)
    @Schema(description = "Optional comment", example = "Handle with care")
    private String comment;

    @Min(0)
    @Schema(description = "Days until expiration", example = "30")
    private long expireAfterDays;

    @Schema(description = "Whether the item is dangerous", example = "false")
    private boolean isDangerous;
}
