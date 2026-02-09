package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to create a new item with physical properties")
public class ItemCreateRequest {

    @Schema(description = "Optional name of item", example = "Laptop")
    @Size(max = 255, message = "Name cannot exceed 255 characters")
    private String name;

    @Schema(description = "Optional QR code for item identification (format: QR-XXXXX)", example = "QR-12345")
    @Size(max = 32, message = "QR code cannot exceed 32 characters")
    private String qrCode;

    @DecimalMin(value = "-273.15", message = "Minimum temperature cannot be below absolute zero")
    @Schema(description = "Minimum temperature requirement in Celsius", example = "5.0", required = true)
    private float minTemp;

    @DecimalMin(value = "-273.15", message = "Maximum temperature cannot be below absolute zero")
    @Schema(description = "Maximum temperature requirement in Celsius", example = "25.0", required = true)
    private float maxTemp;

    @DecimalMin(value = "0.0", message = "Weight must be positive")
    @Schema(description = "Weight of the item in kilograms", example = "1.5", required = true)
    private float weight;

    @DecimalMin(value = "0.0", message = "Size X must be positive")
    @Schema(description = "Width of the item in millimeters", example = "500.0", required = true)
    private float sizeX;

    @DecimalMin(value = "0.0", message = "Size Y must be positive")
    @Schema(description = "Height of the item in millimeters", example = "300.0", required = true)
    private float sizeY;

    @DecimalMin(value = "0.0", message = "Size Z must be positive")
    @Schema(description = "Depth of the item in millimeters", example = "200.0", required = true)
    private float sizeZ;

    @Size(max = 1000, message = "Comment cannot exceed 1000 characters")
    @Schema(description = "Optional comment or description", example = "Handle with care")
    private String comment;

    @Min(value = 0, message = "Expiry days cannot be negative")
    @Schema(description = "Days until expiration (0 for non-perishable)", example = "30", required = true)
    private long expireAfterDays;

    @Schema(description = "Whether the item is dangerous/hazardous", example = "false", required = true)
    private boolean dangerous;
}
