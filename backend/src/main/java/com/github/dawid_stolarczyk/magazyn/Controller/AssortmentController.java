package com.github.dawid_stolarczyk.magazyn.Controller;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.AssortmentDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.AssortmentImportReport;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ResponseTemplate;
import com.github.dawid_stolarczyk.magazyn.Services.ImportExport.AssortmentImportService;
import com.github.dawid_stolarczyk.magazyn.Services.AssortmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/assortments")
@Tag(name = "Assortment", description = "Endpoints for managing assortment placements")
@RequiredArgsConstructor
public class AssortmentController {
    private final AssortmentService assortmentService;
    private final AssortmentImportService assortmentImportService;

    @Operation(summary = "Get all assortments")
    @ApiResponse(responseCode = "200", description = "List of all assortments",
            content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessData.class)))
    @GetMapping
    public ResponseEntity<ResponseTemplate<List<AssortmentDto>>> getAllAssortments() {
        return ResponseEntity.ok(ResponseTemplate.success(assortmentService.getAllAssortments()));
    }

    @Operation(summary = "Get assortment by ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Assortment details",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessData.class))),
            @ApiResponse(responseCode = "400", description = "Assortment not found",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<ResponseTemplate<AssortmentDto>> getAssortmentById(@PathVariable Long id) {
        return ResponseEntity.ok(ResponseTemplate.success(assortmentService.getAssortmentById(id)));
    }

    @Operation(summary = "Create a new assortment placement")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Assortment created successfully",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessData.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input or placement constraints violated",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<AssortmentDto>> createAssortment(@Valid @RequestBody AssortmentDto assortmentDto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ResponseTemplate.success(assortmentService.createAssortment(assortmentDto)));
    }

    @Operation(summary = "Update an existing assortment placement")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Assortment updated successfully",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessData.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input or assortment/rack/item not found",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<AssortmentDto>> updateAssortment(@PathVariable Long id, @Valid @RequestBody AssortmentDto assortmentDto) {
        return ResponseEntity.ok(ResponseTemplate.success(assortmentService.updateAssortment(id, assortmentDto)));
    }

    @Operation(summary = "Delete an assortment placement")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Assortment deleted successfully",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class))),
            @ApiResponse(responseCode = "400", description = "Assortment not found",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<Void>> deleteAssortment(@PathVariable Long id) {
        assortmentService.deleteAssortment(id);
        return ResponseEntity.ok(ResponseTemplate.success());
    }

    @Operation(summary = "Import assortments from CSV")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Import report",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessAssortmentImport.class))),
            @ApiResponse(responseCode = "400", description = "Invalid CSV file",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping(value = "/import", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<AssortmentImportReport>> importAssortments(
            @RequestPart("file") MultipartFile file) {
        return ResponseEntity.ok(ResponseTemplate.success(assortmentImportService.importFromCsv(file)));
    }
}
