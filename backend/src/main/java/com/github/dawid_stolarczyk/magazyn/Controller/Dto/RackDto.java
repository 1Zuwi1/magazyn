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
@Schema(description = "Rack response with computed statistics")
public class RackDto {
    @Schema(description = "Unique identifier of the rack", example = "1")
    private Long id;

    @Schema(description = "Rack marker/label (normalized to uppercase)", example = "A-01")
    private String marker;

    @Schema(description = "ID of the warehouse this rack belongs to", example = "1")
    private Long warehouseId;

    @Schema(description = "Optional comment", example = "Cold storage rack")
    private String comment;

    @Schema(description = "Width dimensions in cells", example = "10")
    private int sizeX;

    @Schema(description = "Height dimensions in cells", example = "10")
    private int sizeY;

    @Schema(description = "Maximum storage temperature in Celsius", example = "25.0")
    private float maxTemp;

    @Schema(description = "Minimum storage temperature in Celsius", example = "-20.0")
    private float minTemp;

    @Schema(description = "Maximum weight capacity in kilograms", example = "1000.0")
    private float maxWeight;

    @Schema(description = "Maximum item width in millimeters", example = "1500.0")
    private float maxSizeX;

    @Schema(description = "Maximum item height in millimeters", example = "2000.0")
    private float maxSizeY;

    @Schema(description = "Maximum item depth in millimeters", example = "1000.0")
    private float maxSizeZ;

    @Schema(description = "Whether the rack accepts dangerous items", example = "false")
    private boolean acceptsDangerous;

    @Schema(description = "Number of occupied slots in this rack (computed)", example = "50")
    private Integer occupiedSlots;

    @Schema(description = "Number of free slots in this rack (computed)", example = "50")
    private Integer freeSlots;

    @Schema(description = "Total number of slots in this rack (computed: sizeX * sizeY)", example = "100")
    private Integer totalSlots;
}
