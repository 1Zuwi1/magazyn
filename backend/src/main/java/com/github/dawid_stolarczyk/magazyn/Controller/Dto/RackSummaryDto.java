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
@Schema(description = "Cumulative statistics across all racks")
public class RackSummaryDto {
    @Schema(description = "Total capacity across all racks (sum of all slots)", example = "10000")
    private Integer totalCapacity;

    @Schema(description = "Total free slots across all racks", example = "6500")
    private Integer freeSlots;

    @Schema(description = "Total occupied slots across all racks", example = "3500")
    private Integer occupiedSlots;

    @Schema(description = "Total number of racks across all warehouses", example = "100")
    private Integer totalRacks;

    @Schema
    private Float totalWeight;
}
