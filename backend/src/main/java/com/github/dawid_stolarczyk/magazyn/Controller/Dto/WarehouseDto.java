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
@Schema(description = "Warehouse response with computed statistics")
public class WarehouseDto {
    @Schema(description = "Unique identifier of warehouse", example = "1")
    private Long id;

    @Schema(description = "Name of warehouse", example = "Central Warehouse")
    private String name;

    @Schema(description = "Number of racks in this warehouse (computed)", example = "10")
    private Integer racksCount;

    @Schema(description = "Total number of occupied slots in all racks (computed)", example = "150")
    private Integer occupiedSlots;

    @Schema(description = "Total number of free slots in all racks (computed)", example = "350")
    private Integer freeSlots;

    @Schema(description = "Total number of slots in all racks (occupied + free) (computed)", example = "500")
    private Integer totalSlots;

    @Schema(description = "Occupancy percentage (0-100)", example = "30")
    private Integer occupancy;
}
