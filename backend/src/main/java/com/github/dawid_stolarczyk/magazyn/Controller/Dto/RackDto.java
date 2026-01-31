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
public class RackDto {
    @Schema(description = "Unique identifier of the rack", example = "1")
    private Long id;

    @NotBlank
    @Schema(description = "Rack marker/label", example = "A-01")
    private String marker;

    @NotNull
    @Schema(description = "ID of the warehouse this rack belongs to", example = "1")
    private Long warehouseId;

    @Schema(description = "Optional comment", example = "Cold storage rack")
    private String comment;

    @Min(1)
    @Schema(description = "Width dimensions (cells)", example = "10")
    private int sizeX;

    @Min(1)
    @Schema(description = "Height dimensions (cells)", example = "10")
    private int sizeY;

    @DecimalMin("-273.15")
    @Schema(description = "Maximum storage temperature", example = "25.0")
    private float maxTemp;

    @DecimalMin("-273.15")
    @Schema(description = "Minimum storage temperature", example = "-20.0")
    private float minTemp;

    @DecimalMin("0.0")
    @Schema(description = "Maximum weight capacity", example = "1000.0")
    private float maxWeight;

    @DecimalMin("0.0")
    @Schema(description = "Maximum item width", example = "1.5")
    private float maxSizeX;

    @DecimalMin("0.0")
    @Schema(description = "Maximum item height", example = "2.0")
    private float maxSizeY;

    @DecimalMin("0.0")
    @Schema(description = "Maximum item depth", example = "1.0")
    private float maxSizeZ;
}
