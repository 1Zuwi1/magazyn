package com.github.dawid_stolarczyk.magazyn.Controller.Inventory;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.*;
import com.github.dawid_stolarczyk.magazyn.Services.ImportExport.WarehouseImportService;
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

@RestController
@RequestMapping("/warehouses")
@Tag(name = "Warehouses", description = "Endpoints for managing user warehouses")
@RequiredArgsConstructor
public class WarehouseController {
    private final WarehouseService warehouseService;
    private final WarehouseImportService warehouseImportService;
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
            @Parameter(description = "Filter by warehouse name containing this string", example = "Central") @RequestParam(required = false) String nameFilter) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        PageRequest pageable = PageRequest.of(page, Math.min(size, 100), sort);
        return ResponseEntity.ok(ResponseTemplate.success(
                warehouseService.getAllWarehousesPaged(request, pageable, nameFilter)));
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
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = PagedResponse.class)))
    @GetMapping("/{warehouseId}/racks")
    public ResponseEntity<ResponseTemplate<PagedResponse<RackDto>>> getRacksByWarehouse(
            @PathVariable Long warehouseId,
            HttpServletRequest request,
            @Parameter(description = "Page number (0-indexed)", example = "0") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size", example = "20") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort by field", example = "id") @RequestParam(defaultValue = "id") String sortBy,
            @Parameter(description = "Sort direction (asc/desc)", example = "asc") @RequestParam(defaultValue = "asc") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        PageRequest pageable = PageRequest.of(page, Math.min(size, 100), sort);
        return ResponseEntity.ok(ResponseTemplate.success(
                PagedResponse.from(rackService.getRacksByWarehousePaged(warehouseId, request, pageable))));
    }

    @Operation(summary = "Get assortments by warehouse ID with pagination",
            description = "Returns paginated list of all assortments (items) stored in a specific warehouse, including full item details")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = PagedResponse.class))),
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
            @Parameter(description = "Sort direction (asc/desc)", example = "asc") @RequestParam(defaultValue = "asc") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        PageRequest pageable = PageRequest.of(page, Math.min(size, 100), sort);
        return ResponseEntity.ok(ResponseTemplate.success(
                PagedResponse.from(assortmentService.getAssortmentsByWarehouseIdPaged(warehouseId, request, pageable))));
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
}
