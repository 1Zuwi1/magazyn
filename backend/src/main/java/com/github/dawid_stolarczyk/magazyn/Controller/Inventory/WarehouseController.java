package com.github.dawid_stolarczyk.magazyn.Controller.Inventory;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ResponseTemplate;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.WarehouseDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.WarehouseImportReport;
import com.github.dawid_stolarczyk.magazyn.Services.ImportExport.WarehouseImportService;
import com.github.dawid_stolarczyk.magazyn.Services.Inventory.WarehouseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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

    @Operation(summary = "Get all user warehouses")
    @ApiResponse(responseCode = "200", description = "List of all user warehouses",
            content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessData.class)))
    @GetMapping
    public ResponseEntity<ResponseTemplate<List<WarehouseDto>>> getAllWarehouses() {
        return ResponseEntity.ok(ResponseTemplate.success(warehouseService.getAllWarehouses()));
    }

    @Operation(summary = "Get warehouse by ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Warehouse details",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessData.class))),
            @ApiResponse(responseCode = "400", description = "Warehouse not found or access denied",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<ResponseTemplate<WarehouseDto>> getWarehouseById(@PathVariable Long id) {
        return ResponseEntity.ok(ResponseTemplate.success(warehouseService.getWarehouseById(id)));
    }

    @Operation(summary = "Create a new warehouse")
    @ApiResponse(responseCode = "201", description = "Warehouse created successfully",
            content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessData.class)))
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<WarehouseDto>> createWarehouse(@Valid @RequestBody WarehouseDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ResponseTemplate.success(warehouseService.createWarehouse(dto)));
    }

    @Operation(summary = "Update a warehouse")
    @ApiResponse(responseCode = "200", description = "Warehouse updated successfully",
            content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessData.class)))
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<WarehouseDto>> updateWarehouse(@PathVariable Long id, @Valid @RequestBody WarehouseDto dto) {
        return ResponseEntity.ok(ResponseTemplate.success(warehouseService.updateWarehouse(id, dto)));
    }

    @Operation(summary = "Delete a warehouse")
    @ApiResponse(responseCode = "200", description = "Warehouse deleted successfully",
            content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class)))
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<Void>> deleteWarehouse(@PathVariable Long id) {
        warehouseService.deleteWarehouse(id);
        return ResponseEntity.ok(ResponseTemplate.success());
    }

    @Operation(summary = "Import warehouses from CSV")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Import report",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessWarehouseImport.class))),
            @ApiResponse(responseCode = "400", description = "Invalid CSV file",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<WarehouseImportReport>> importWarehouses(
            @RequestPart("file") MultipartFile file) {
        return ResponseEntity.ok(ResponseTemplate.success(warehouseImportService.importFromCsv(file)));
    }
}
