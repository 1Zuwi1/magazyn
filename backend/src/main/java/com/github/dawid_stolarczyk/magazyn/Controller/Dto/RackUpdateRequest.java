package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to update a rack")
public class RackUpdateRequest {

    @NotBlank(message = "Rack marker is required")
    @Schema(
        description = "Rack marker/label - will be normalized to uppercase alphanumeric with dashes/underscores only",
        example = "A-01",
        required = true
    )
    private String marker;

    @NotNull(message = "Warehouse ID is required")
    @Schema(description = "ID of the warehouse this rack belongs to", example = "1", required = true)
    private Long warehouseId;

    @Schema(description = "Optional comment", example = "Cold storage rack - updated")
    private String comment;

    @Min(value = 1, message = "Size X must be at least 1")
    @Schema(description = "Width dimensions in cells (1-1000)", example = "10", required = true)
    private int sizeX;

    @Min(value = 1, message = "Size Y must be at least 1")
    @Schema(description = "Height dimensions in cells (1-1000)", example = "10", required = true)
    private int sizeY;

    @DecimalMin(value = "-273.15", message = "Temperature cannot be below absolute zero")
    @Schema(description = "Maximum storage temperature in Celsius", example = "25.0", required = true)
    private float maxTemp;

    @DecimalMin(value = "-273.15", message = "Temperature cannot be below absolute zero")
    @Schema(description = "Minimum storage temperature in Celsius", example = "-20.0", required = true)
    private float minTemp;

    @DecimalMin(value = "0.0", message = "Weight must be positive")
    @Schema(description = "Maximum weight capacity in kilograms", example = "1000.0", required = true)
    private float maxWeight;

    @DecimalMin(value = "0.0", message = "Size must be positive")
    @Schema(description = "Maximum item width in millimeters", example = "1500.0", required = true)
    private float maxSizeX;

    @DecimalMin(value = "0.0", message = "Size must be positive")
    @Schema(description = "Maximum item height in millimeters", example = "2000.0", required = true)
    private float maxSizeY;

    @DecimalMin(value = "0.0", message = "Size must be positive")
    @Schema(description = "Maximum item depth in millimeters", example = "1000.0", required = true)
    private float maxSizeZ;

    @Schema(description = "Whether the rack accepts dangerous/hazardous items", example = "false", required = true)
    private boolean acceptsDangerous;
}
