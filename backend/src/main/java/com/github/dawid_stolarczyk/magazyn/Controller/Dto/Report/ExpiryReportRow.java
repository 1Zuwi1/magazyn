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
@Schema(description = "Single row in the expiry report")
public class ExpiryReportRow {

    @Schema(description = "Item name", example = "Mleko 3.2%")
    private String itemName;

    @Schema(description = "Item code", example = "MLK-001")
    private String itemCode;

    @Schema(description = "Expiration date")
    private String expirationDate;

    @Schema(description = "Rack marker", example = "A-01")
    private String rackMarker;

    @Schema(description = "Warehouse name", example = "Magazyn Główny")
    private String warehouseName;

    @Schema(description = "Quantity of assortments", example = "5")
    private int quantity;

    @Schema(description = "Whether the item has already expired", example = "false")
    private boolean alreadyExpired;
}
