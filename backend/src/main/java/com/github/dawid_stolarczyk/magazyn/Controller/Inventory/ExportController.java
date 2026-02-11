package com.github.dawid_stolarczyk.magazyn.Controller.Inventory;

import com.github.dawid_stolarczyk.magazyn.Services.ImportExport.WarehouseExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/export")
@Tag(name = "Export", description = "Endpoints for exporting warehouse data to CSV")
@RequiredArgsConstructor
public class ExportController {

    private final WarehouseExportService warehouseExportService;

    @Operation(summary = "Export all warehouses to CSV",
            description = "Export all warehouses to CSV format compatible with import")
    @ApiResponse(responseCode = "200", description = "CSV file",
            content = @Content(mediaType = "text/csv", schema = @Schema(type = "string")))
    @GetMapping(value = "/warehouses", produces = "text/csv")
    public ResponseEntity<String> exportAllWarehouses(HttpServletRequest httpRequest) {
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=warehouses.csv")
                .body(warehouseExportService.exportAllWarehouses(httpRequest));
    }

    @Operation(summary = "Export warehouse by ID to CSV",
            description = "Export specific warehouse to CSV format compatible with import")
    @ApiResponse(responseCode = "200", description = "CSV file",
            content = @Content(mediaType = "text/csv", schema = @Schema(type = "string")))
    @GetMapping(value = "/warehouses/{warehouseId}", produces = "text/csv")
    public ResponseEntity<String> exportWarehouseById(
            @Parameter(description = "Warehouse ID", example = "1") @PathVariable Long warehouseId,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=warehouse_" + warehouseId + ".csv")
                .body(warehouseExportService.exportWarehouseById(warehouseId, httpRequest));
    }

    @Operation(summary = "Export all items to CSV",
            description = "Export all items to CSV format compatible with import")
    @ApiResponse(responseCode = "200", description = "CSV file",
            content = @Content(mediaType = "text/csv", schema = @Schema(type = "string")))
    @GetMapping(value = "/items", produces = "text/csv")
    public ResponseEntity<String> exportAllItems(HttpServletRequest httpRequest) {
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=items.csv")
                .body(warehouseExportService.exportAllItems(httpRequest));
    }

    @Operation(summary = "Export all racks to CSV",
            description = "Export all racks to CSV format compatible with import")
    @ApiResponse(responseCode = "200", description = "CSV file",
            content = @Content(mediaType = "text/csv", schema = @Schema(type = "string")))
    @GetMapping(value = "/racks", produces = "text/csv")
    public ResponseEntity<String> exportAllRacks(HttpServletRequest httpRequest) {
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=racks.csv")
                .body(warehouseExportService.exportAllRacks(httpRequest));
    }

    @Operation(summary = "Export all assortments to CSV",
            description = "Export all assortments to CSV format compatible with import")
    @ApiResponse(responseCode = "200", description = "CSV file",
            content = @Content(mediaType = "text/csv", schema = @Schema(type = "string")))
    @GetMapping(value = "/assortments", produces = "text/csv")
    public ResponseEntity<String> exportAllAssortments(HttpServletRequest httpRequest) {
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=assortments.csv")
                .body(warehouseExportService.exportAllAssortments(httpRequest));
    }

    @Operation(summary = "Export items by warehouse ID to CSV",
            description = "Export items stored in specific warehouse to CSV format compatible with import")
    @ApiResponse(responseCode = "200", description = "CSV file",
            content = @Content(mediaType = "text/csv", schema = @Schema(type = "string")))
    @GetMapping(value = "/warehouses/{warehouseId}/items", produces = "text/csv")
    public ResponseEntity<String> exportItemsByWarehouseId(
            @Parameter(description = "Warehouse ID", example = "1") @PathVariable Long warehouseId) {
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=warehouse_" + warehouseId + "_items.csv")
                .body(warehouseExportService.exportItemsByWarehouseId(warehouseId));
    }

    @Operation(summary = "Export racks by warehouse ID to CSV",
            description = "Export racks from specific warehouse to CSV format compatible with import")
    @ApiResponse(responseCode = "200", description = "CSV file",
            content = @Content(mediaType = "text/csv", schema = @Schema(type = "string")))
    @GetMapping(value = "/warehouses/{warehouseId}/racks", produces = "text/csv")
    public ResponseEntity<String> exportRacksByWarehouseId(
            @Parameter(description = "Warehouse ID", example = "1") @PathVariable Long warehouseId) {
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=warehouse_" + warehouseId + "_racks.csv")
                .body(warehouseExportService.exportRacksByWarehouseId(warehouseId));
    }

    @Operation(summary = "Export assortments by warehouse ID to CSV",
            description = "Export assortments from specific warehouse to CSV format compatible with import")
    @ApiResponse(responseCode = "200", description = "CSV file",
            content = @Content(mediaType = "text/csv", schema = @Schema(type = "string")))
    @GetMapping(value = "/warehouses/{warehouseId}/assortments", produces = "text/csv")
    public ResponseEntity<String> exportAssortmentsByWarehouseId(
            @Parameter(description = "Warehouse ID", example = "1") @PathVariable Long warehouseId) {
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=warehouse_" + warehouseId + "_assortments.csv")
                .body(warehouseExportService.exportAssortmentsByWarehouseId(warehouseId));
    }

    @Operation(summary = "Export all data by warehouse ID to CSV",
            description = "Export items, racks and assortments from specific warehouse to CSV format compatible with import (combined export)")
    @ApiResponse(responseCode = "200", description = "CSV file with sections for items, racks and assortments",
            content = @Content(mediaType = "text/csv", schema = @Schema(type = "string")))
    @GetMapping(value = "/warehouses/{warehouseId}/all", produces = "text/csv")
    public ResponseEntity<String> exportAllByWarehouseId(
            @Parameter(description = "Warehouse ID", example = "1") @PathVariable Long warehouseId) {
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=warehouse_" + warehouseId + "_all.csv")
                .body(warehouseExportService.exportAllByWarehouseId(warehouseId));
    }
}
