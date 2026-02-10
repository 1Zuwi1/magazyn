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
@Schema(description = "Cumulative statistics across all warehouses")
public class WarehouseSummaryDto {

    @Schema(description = "Total capacity across all warehouses (sum of all slots)", example = "10000")
    private Integer totalCapacity;

    @Schema(description = "Total free slots across all warehouses", example = "6500")
    private Integer freeSlots;

    @Schema(description = "Total occupied slots across all warehouses", example = "3500")
    private Integer occupiedSlots;

    @Schema(description = "Occupancy percentage across all warehouses (0-100)", example = "35")
    private Integer occupancy;

    @Schema(description = "Total number of warehouses", example = "5")
    private Integer totalWarehouses;

    @Schema(description = "Total number of racks across all warehouses", example = "100")
    private Integer totalRacks;
}
