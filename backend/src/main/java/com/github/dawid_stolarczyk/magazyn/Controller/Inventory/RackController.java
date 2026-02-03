package com.github.dawid_stolarczyk.magazyn.Controller.Inventory;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.RackDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.RackImportReport;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ResponseTemplate;
import com.github.dawid_stolarczyk.magazyn.Services.ImportExport.RackImportService;
import com.github.dawid_stolarczyk.magazyn.Services.Inventory.RackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/racks")
@Tag(name = "Racks", description = "Endpoints for managing warehouse racks")
@RequiredArgsConstructor
public class RackController {
    private final RackService rackService;
    private final RackImportService rackImportService;

    @Operation(summary = "Get all racks")
    @ApiResponse(responseCode = "200", description = "List of all racks",
            content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessData.class)))
    @GetMapping
    public ResponseEntity<ResponseTemplate<List<RackDto>>> getAllRacks(HttpServletRequest request) {
        return ResponseEntity.ok(ResponseTemplate.success(rackService.getAllRacks(request)));
    }

    @Operation(summary = "Get racks by warehouse ID")
    @ApiResponse(responseCode = "200", description = "List of racks in a warehouse",
            content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessData.class)))
    @GetMapping("/warehouse/{warehouseId}")
    public ResponseEntity<ResponseTemplate<List<RackDto>>> getRacksByWarehouse(@PathVariable Long warehouseId, HttpServletRequest request) {
        return ResponseEntity.ok(ResponseTemplate.success(rackService.getRacksByWarehouse(warehouseId, request)));
    }

    @Operation(summary = "Get rack by ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Rack details",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessData.class))),
            @ApiResponse(responseCode = "400", description = "Rack not found",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<ResponseTemplate<RackDto>> getRackById(@PathVariable Long id, HttpServletRequest request) {
        return ResponseEntity.ok(ResponseTemplate.success(rackService.getRackById(id, request)));
    }

    @Operation(summary = "Create a new rack")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Rack created successfully",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessData.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input or warehouse not found",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<RackDto>> createRack(@Valid @RequestBody RackDto rackDto, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ResponseTemplate.success(rackService.createRack(rackDto, request)));
    }

    @Operation(summary = "Update an existing rack")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Rack updated successfully",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessData.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input or rack/warehouse not found",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<RackDto>> updateRack(@PathVariable Long id, @Valid @RequestBody RackDto rackDto, HttpServletRequest request) {
        return ResponseEntity.ok(ResponseTemplate.success(rackService.updateRack(id, rackDto, request)));
    }

    @Operation(summary = "Delete a rack")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Rack deleted successfully",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class))),
            @ApiResponse(responseCode = "400", description = "Rack not found",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<Void>> deleteRack(@PathVariable Long id, HttpServletRequest request) {
        rackService.deleteRack(id, request);
        return ResponseEntity.ok(ResponseTemplate.success());
    }

    @Operation(summary = "Import racks from CSV")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Import report",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessRackImport.class))),
            @ApiResponse(responseCode = "400", description = "Invalid CSV file",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping(value = "/import", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<RackImportReport>> importRacks(
            @RequestParam("file") MultipartFile file
    ) {
        return ResponseEntity.ok(ResponseTemplate.success(rackImportService.importFromCsv(file)));
    }
}
