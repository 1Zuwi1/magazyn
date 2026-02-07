package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Item response with all properties")
public class ItemDto {
    @Schema(description = "Unique identifier of the item", example = "1")
    private Long id;

    @Schema(description = "Unique auto-generated GS1-128 barcode (14 digits)", example = "12345678901234")
    private String code;

    @Schema(description = "Name of the item", example = "Laptop")
    private String name;

    @Schema(description = "URL or path to the item's photo", example = "/api/items/1/photo")
    private String photoUrl;

    @Schema(description = "Minimum temperature requirement in Celsius", example = "5.0")
    private float minTemp;

    @Schema(description = "Maximum temperature requirement in Celsius", example = "25.0")
    private float maxTemp;

    @Schema(description = "Weight of the item in kilograms", example = "1.5")
    private float weight;

    @Schema(description = "Width of the item in millimeters", example = "500.0")
    private float sizeX;

    @Schema(description = "Height of the item in millimeters", example = "300.0")
    private float sizeY;

    @Schema(description = "Depth of the item in millimeters", example = "200.0")
    private float sizeZ;

    @Schema(description = "Optional comment", example = "Handle with care")
    private String comment;

    @Schema(description = "Days until expiration", example = "30")
    private Long expireAfterDays;

    @Schema(description = "Whether the item is dangerous", example = "false")
    private boolean isDangerous;
}
