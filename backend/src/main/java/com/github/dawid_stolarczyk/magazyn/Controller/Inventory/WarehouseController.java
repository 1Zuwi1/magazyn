package com.github.dawid_stolarczyk.magazyn.Controller.Inventory;

import com.github.dawid_stolarczyk.magazyn.Common.ConfigurationConstants;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.*;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.ExpiryFilters;
import com.github.dawid_stolarczyk.magazyn.Services.ImportExport.WarehouseImportService;
import com.github.dawid_stolarczyk.magazyn.Services.ImportExport.WarehouseExportService;
import com.github.dawid_stolarczyk.magazyn.Services.Inventory.WarehouseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;

@RestController
@RequestMapping("/warehouses")
@Tag(name = "Warehouses", description = "Endpoints for managing user warehouses")
@RequiredArgsConstructor
public class WarehouseController {
    private final WarehouseService warehouseService;
    private final WarehouseImportService warehouseImportService;
    private final WarehouseExportService warehouseExportService;
    private final com.github.dawid_stolarczyk.magazyn.Services.Inventory.RackService rackService;
    private final com.github.dawid_stolarczyk.magazyn.Services.Inventory.AssortmentService assortmentService;

    @Operation(summary = "Get all warehouses with pagination",
            description = "Returns paginated list of all warehouses with statistics per warehouse (racks count, occupied slots, free slots) and cumulative summary across all warehouses (total capacity, total free slots, total occupied slots)")
    @ApiResponse(responseCode = "200", description = "Success",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = WarehousePagedResponse.class)))
    @GetMapping
    public ResponseEntity<ResponseTemplate<WarehousePagedResponse>> getAllWarehouses(
            HttpServletRequest request,
            @Parameter(description = "Page number (0-indexed)", example = "0") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size", example = "20") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort by field", example = "id") @RequestParam(defaultValue = "id") String sortBy,
            @Parameter(description = "Sort direction (asc/desc)", example = "asc") @RequestParam(defaultValue = "asc") String sortDir,
            @Parameter(description = "Filter by warehouse name containing this string", example = "Central") @RequestParam(required = false) String nameFilter,
            @RequestParam(required = false) Integer minPercentOfOccupiedSlots,
            @RequestParam(required = false, defaultValue = "false") boolean onlyNonEmpty) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        PageRequest pageable = PageRequest.of(page, Math.min(size, ConfigurationConstants.MAX_PAGE_SIZE), sort);
        return ResponseEntity.ok(ResponseTemplate.success(
                warehouseService.getAllWarehousesPaged(request, pageable, nameFilter, minPercentOfOccupiedSlots, onlyNonEmpty)));
    }

    @Operation(summary = "Get warehouse by ID",
            description = "Returns warehouse details with statistics: racks count, occupied slots, and free slots")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = WarehouseDto.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: WAREHOUSE_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<ResponseTemplate<WarehouseDto>> getWarehouseById(@PathVariable Long id, HttpServletRequest request) {
        return ResponseEntity.ok(ResponseTemplate.success(warehouseService.getWarehouseById(id, request)));
    }

    @Operation(summary = "Create warehouse (ADMIN only)",
            description = "Creates a new warehouse with only a name. Statistics (racks count, slots) are computed automatically.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Success - returns created warehouse with computed statistics",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = WarehouseDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<WarehouseDto>> createWarehouse(@Valid @RequestBody WarehouseCreateRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ResponseTemplate.success(warehouseService.createWarehouse(request, httpRequest)));
    }

    @Operation(summary = "Update a warehouse (ADMIN only)",
            description = "Updates warehouse name. Statistics are recomputed automatically.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Warehouse updated successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = WarehouseDto.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: WAREHOUSE_NOT_FOUND or invalid input",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<WarehouseDto>> updateWarehouse(@PathVariable Long id, @Valid @RequestBody WarehouseUpdateRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ResponseTemplate.success(warehouseService.updateWarehouse(id, request, httpRequest)));
    }

    @Operation(summary = "Delete a warehouse (ADMIN only)")
    @ApiResponse(responseCode = "200", description = "Warehouse deleted successfully",
            content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class)))
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<Void>> deleteWarehouse(@PathVariable Long id, HttpServletRequest request) {
        warehouseService.deleteWarehouse(id, request);
        return ResponseEntity.ok(ResponseTemplate.success());
    }

    @Operation(summary = "Get racks by warehouse ID with pagination")
    @ApiResponse(responseCode = "200", description = "Success",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseTemplate.PagedRacksResponse.class)))
    @GetMapping("/{warehouseId}/racks")
    public ResponseEntity<ResponseTemplate<RackPagedResponse>> getRacksByWarehouse(
            @PathVariable Long warehouseId,
            HttpServletRequest request,
            @Parameter(description = "Page number (0-indexed)", example = "0") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size", example = "20") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort by field", example = "id") @RequestParam(defaultValue = "id") String sortBy,
            @Parameter(description = "Sort direction (asc/desc)", example = "asc") @RequestParam(defaultValue = "asc") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        PageRequest pageable = PageRequest.of(page, Math.min(size, ConfigurationConstants.MAX_PAGE_SIZE), sort);
        return ResponseEntity.ok(ResponseTemplate.success((rackService.getRacksByWarehousePaged(warehouseId, request, pageable))));
    }

    @Operation(summary = "Get assortments by warehouse ID with pagination",
            description = "Returns paginated list of all assortments (items) stored in a specific warehouse, including full item details")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseTemplate.PagedAssortmentsWithItemResponse.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: WAREHOUSE_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @GetMapping("/{warehouseId}/assortments")
    public ResponseEntity<ResponseTemplate<PagedResponse<AssortmentWithItemDto>>> getAssortmentsByWarehouse(
            @PathVariable Long warehouseId,
            HttpServletRequest request,
            @Parameter(description = "Page number (0-indexed)", example = "0") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size", example = "20") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort by field", example = "id") @RequestParam(defaultValue = "id") String sortBy,
            @Parameter(description = "Sort direction (asc/desc)", example = "asc") @RequestParam(defaultValue = "asc") String sortDir,
            @Parameter(description = "Filter by expiration") @RequestParam(defaultValue = "ALL") ArrayList<ExpiryFilters> expiryFilters,
            @Parameter(description = "Search by item name or code (case-insensitive)", example = "milk") @RequestParam(required = false) String search,
            @Parameter(description = "Filter by week to expire (expires within 7 days)", example = "true") @RequestParam(required = false) Boolean weekToExpire) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        PageRequest pageable = PageRequest.of(page, Math.min(size, ConfigurationConstants.MAX_PAGE_SIZE), sort);
        return ResponseEntity.ok(ResponseTemplate.success(
                PagedResponse.from(assortmentService.getAssortmentsByWarehouseIdPaged(warehouseId, request, pageable, expiryFilters, search, weekToExpire))));
    }

    @Operation(
            summary = "Import warehouses from CSV (ADMIN only)",
            description = """
                    Import magazynów z pliku CSV z nagłówkiem.
                    
                    **Format CSV:**
                    - Separator: **średnik (;)**
                    - Kodowanie: **UTF-8**
                    - **Z nagłówkiem** (pierwsza linia to nazwy kolumn)
                    - Linie zaczynające się od '#' są ignorowane (komentarze)
                    
                    **Wymagane kolumny (w dowolnej kolejności):**
                    - **name** (String) - Nazwa magazynu
                    
                    **Przykład pliku CSV:**
                    ```
                    #Linie zaczynające się od '#' są ignorowane
                    name
                    Magazyn Centralny
                    Magazyn Regionalny Warszawa
                    Magazyn Chłodniczy
                    ```
                    
                    **Walidacja pliku:**
                    - Tylko pliki CSV (rozszerzenia: .csv, .txt)
                    - Content-Type: text/csv, text/plain, application/csv
                    - Maksymalny rozmiar: 5MB
                    - Plik nie może być pusty
                    
                    **Odpowiedź:**
                    - `processedLines` - liczba przetworzonych linii
                    - `imported` - liczba zaimportowanych magazynów
                    - `errors` - lista błędów (jeśli wystąpiły)
                    """
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Import report with statistics",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessWarehouseImport.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid CSV file or validation errors",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Access denied - requires ADMIN role",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))
            )
    })
    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<WarehouseImportReport>> importWarehouses(
            @RequestPart("file") MultipartFile file) {
        return ResponseEntity.ok(ResponseTemplate.success(warehouseImportService.importFromCsv(file)));
    }

    @Operation(summary = "Export all warehouses to CSV",
            description = "Export all warehouses to CSV format compatible with import")
    @ApiResponse(responseCode = "200", description = "CSV file",
            content = @Content(mediaType = "text/csv"))
    @GetMapping(value = "/export", produces = "text/csv")
    public ResponseEntity<String> exportAllWarehouses() {
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=warehouses.csv")
                .body(warehouseExportService.exportAllWarehouses());
    }

    @Operation(summary = "Export warehouse by ID to CSV",
            description = "Export specific warehouse to CSV format compatible with import")
    @ApiResponse(responseCode = "200", description = "CSV file",
            content = @Content(mediaType = "text/csv"))
    @GetMapping(value = "/{warehouseId}/export", produces = "text/csv")
    public ResponseEntity<String> exportWarehouseById(@PathVariable Long warehouseId) {
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=warehouse_" + warehouseId + ".csv")
                .body(warehouseExportService.exportWarehouseById(warehouseId));
    }

    @Operation(summary = "Export all items to CSV",
            description = "Export all items to CSV format compatible with import")
    @ApiResponse(responseCode = "200", description = "CSV file",
            content = @Content(mediaType = "text/csv"))
    @GetMapping(value = "/items/export", produces = "text/csv")
    public ResponseEntity<String> exportAllItems() {
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=items.csv")
                .body(warehouseExportService.exportAllItems());
    }

    @Operation(summary = "Export items by warehouse ID to CSV",
            description = "Export items stored in specific warehouse to CSV format compatible with import")
    @ApiResponse(responseCode = "200", description = "CSV file",
            content = @Content(mediaType = "text/csv"))
    @GetMapping(value = "/{warehouseId}/items/export", produces = "text/csv")
    public ResponseEntity<String> exportItemsByWarehouseId(@PathVariable Long warehouseId) {
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=warehouse_" + warehouseId + "_items.csv")
                .body(warehouseExportService.exportItemsByWarehouseId(warehouseId));
    }

    @Operation(summary = "Export racks by warehouse ID to CSV",
            description = "Export racks from specific warehouse to CSV format compatible with import")
    @ApiResponse(responseCode = "200", description = "CSV file",
            content = @Content(mediaType = "text/csv"))
    @GetMapping(value = "/{warehouseId}/racks/export", produces = "text/csv")
    public ResponseEntity<String> exportRacksByWarehouseId(@PathVariable Long warehouseId) {
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=warehouse_" + warehouseId + "_racks.csv")
                .body(warehouseExportService.exportRacksByWarehouseId(warehouseId));
    }

    @Operation(summary = "Export assortments by warehouse ID to CSV",
            description = "Export assortments from specific warehouse to CSV format compatible with import")
    @ApiResponse(responseCode = "200", description = "CSV file",
            content = @Content(mediaType = "text/csv"))
    @GetMapping(value = "/{warehouseId}/assortments/export", produces = "text/csv")
    public ResponseEntity<String> exportAssortmentsByWarehouseId(@PathVariable Long warehouseId) {
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=warehouse_" + warehouseId + "_assortments.csv")
                .body(warehouseExportService.exportAssortmentsByWarehouseId(warehouseId));
    }

    @Operation(summary = "Export all data by warehouse ID to CSV",
            description = "Export items, racks and assortments from specific warehouse to CSV format compatible with import (combined export)")
    @ApiResponse(responseCode = "200", description = "CSV file with sections for items, racks and assortments",
            content = @Content(mediaType = "text/csv"))
    @GetMapping(value = "/{warehouseId}/export-all", produces = "text/csv")
    public ResponseEntity<String> exportAllByWarehouseId(@PathVariable Long warehouseId) {
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=warehouse_" + warehouseId + "_all.csv")
                .body(warehouseExportService.exportAllByWarehouseId(warehouseId));
    }
}
