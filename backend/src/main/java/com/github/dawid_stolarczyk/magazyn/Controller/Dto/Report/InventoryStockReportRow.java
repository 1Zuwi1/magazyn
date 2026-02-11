package com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Single row in the inventory stock report")
public class InventoryStockReportRow {

    @Schema(description = "Warehouse name", example = "Magazyn Główny")
    private String warehouseName;

    @Schema(description = "Warehouse ID", example = "1")
    private Long warehouseId;

    @Schema(description = "Rack marker", example = "A-01")
    private String rackMarker;

    @Schema(description = "Rack ID", example = "1")
    private Long rackId;

    @Schema(description = "Item name", example = "Mleko 3.2%")
    private String itemName;

    @Schema(description = "Item code", example = "MLK-001")
    private String itemCode;

    @Schema(description = "Quantity on rack", example = "10")
    private int quantity;

    @Schema(description = "Oldest assortment creation date")
    private String oldestCreatedAt;

    @Schema(description = "Nearest expiration date")
    private String nearestExpiresAt;
}
