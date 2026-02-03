package com.github.dawid_stolarczyk.magazyn.Controller.Inventory;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ResponseTemplate;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.WarehouseDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.WarehouseImportReport;
import com.github.dawid_stolarczyk.magazyn.Services.ImportExport.WarehouseImportService;
import com.github.dawid_stolarczyk.magazyn.Services.Inventory.WarehouseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/warehouses")
@Tag(name = "Warehouses", description = "Endpoints for managing user warehouses")
@RequiredArgsConstructor
public class WarehouseController {
    private final WarehouseService warehouseService;
    private final WarehouseImportService warehouseImportService;

    @Operation(summary = "Get all warehouses",
            description = "Returns list of all warehouses with statistics: racks count, occupied slots, and free slots")
    @ApiResponse(responseCode = "200", description = "Success - returns list of warehouses (id, name, racksCount, occupiedSlots, freeSlots)",
            content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = WarehouseDto.class))))
    @GetMapping
    public ResponseEntity<ResponseTemplate<List<WarehouseDto>>> getAllWarehouses(HttpServletRequest request) {
        return ResponseEntity.ok(ResponseTemplate.success(warehouseService.getAllWarehouses(request)));
    }

    @Operation(summary = "Get warehouse by ID",
            description = "Returns warehouse details with statistics: racks count, occupied slots, and free slots")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - returns warehouse details (id, name, racksCount, occupiedSlots, freeSlots)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = WarehouseDto.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: WAREHOUSE_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<ResponseTemplate<WarehouseDto>> getWarehouseById(@PathVariable Long id, HttpServletRequest request) {
        return ResponseEntity.ok(ResponseTemplate.success(warehouseService.getWarehouseById(id, request)));
    }

    @Operation(summary = "Create warehouse [ADMIN]")
    @ApiResponse(responseCode = "201", description = "Success - returns created warehouse",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = WarehouseDto.class)))
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<WarehouseDto>> createWarehouse(@Valid @RequestBody WarehouseDto dto, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ResponseTemplate.success(warehouseService.createWarehouse(dto, request)));
    }

    @Operation(summary = "Update a warehouse")
    @ApiResponse(responseCode = "200", description = "Warehouse updated successfully",
            content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessData.class)))
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<WarehouseDto>> updateWarehouse(@PathVariable Long id, @Valid @RequestBody WarehouseDto dto, HttpServletRequest request) {
        return ResponseEntity.ok(ResponseTemplate.success(warehouseService.updateWarehouse(id, dto, request)));
    }

    @Operation(summary = "Delete a warehouse")
    @ApiResponse(responseCode = "200", description = "Warehouse deleted successfully",
            content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class)))
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<Void>> deleteWarehouse(@PathVariable Long id, HttpServletRequest request) {
        warehouseService.deleteWarehouse(id, request);
        return ResponseEntity.ok(ResponseTemplate.success());
    }

    @Operation(
            summary = "Import warehouses from CSV",
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
