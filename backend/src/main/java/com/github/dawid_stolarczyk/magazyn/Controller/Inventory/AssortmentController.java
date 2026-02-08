package com.github.dawid_stolarczyk.magazyn.Controller.Inventory;

import com.github.dawid_stolarczyk.magazyn.Common.ConfigurationConstants;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.AssortmentDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.AssortmentImportReport;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.PagedResponse;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ResponseTemplate;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.ExpiryFilters;
import com.github.dawid_stolarczyk.magazyn.Services.ImportExport.AssortmentImportService;
import com.github.dawid_stolarczyk.magazyn.Services.Inventory.AssortmentService;
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
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;

@RestController
@RequestMapping("/assortments")
@Tag(name = "Assortment", description = "Endpoints for managing assortment placements")
@RequiredArgsConstructor
public class AssortmentController {
    private final AssortmentService assortmentService;
    private final AssortmentImportService assortmentImportService;

    @Operation(summary = "Get all assortments with pagination and filters",
            description = "Retrieve assortments with optional filters for item name/code search, week to expire status, and expiration filters")
    @ApiResponse(responseCode = "200", description = "Success",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = ResponseTemplate.PagedAssortmentsResponse.class)))
    @GetMapping
    public ResponseEntity<ResponseTemplate<PagedResponse<AssortmentDto>>> getAllAssortments(
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
                PagedResponse.from(assortmentService.getAllAssortmentsPaged(request, pageable, expiryFilters, search, weekToExpire))));
    }

    @Operation(summary = "Get assortment by ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AssortmentDto.class))),
            @ApiResponse(responseCode = "404", description = "Error codes: ASSORTMENT_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<ResponseTemplate<AssortmentDto>> getAssortmentById(@PathVariable Long id, HttpServletRequest request) {
        try {
            return ResponseEntity.ok(ResponseTemplate.success(assortmentService.getAssortmentById(id, request)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ResponseTemplate.error(e.getMessage()));
        }
    }

    // REMOVED: Direct assortment creation bypasses inbound operation validation and tracking.
    // Use POST /inventory/inbound-operations/execute instead for proper inbound flow.

    @Operation(
            summary = "Update assortment metadata only (ADMIN only)",
            description = "Allows updating expiration date only. Position, rack, and item cannot be changed - use inbound/outbound operations for moves."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - returns updated assortment",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AssortmentDto.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: ASSORTMENT_NOT_FOUND, POSITION_UPDATE_FORBIDDEN, RACK_UPDATE_FORBIDDEN, ITEM_UPDATE_FORBIDDEN",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<AssortmentDto>> updateAssortment(@PathVariable Long id, @Valid @RequestBody AssortmentDto assortmentDto, HttpServletRequest request) {
        return ResponseEntity.ok(ResponseTemplate.success(assortmentService.updateAssortmentMetadata(id, assortmentDto, request)));
    }

    // REMOVED: Direct assortment deletion bypasses outbound operation tracking and FIFO compliance.
    // Use POST /inventory/outbound-operations/execute instead for proper outbound flow.

    @Operation(
            summary = "Import assortments (placements) from CSV (ADMIN only)",
            description = """
                    Import przypisań produktów do regałów z pliku CSV **Z NAGŁÓWKIEM** (dowolna kolejność).
                    
                    **Format CSV:**
                    - Separator: **średnik (;)**
                    - Kodowanie: **UTF-8**
                    - **Z nagłówkiem** (pierwsza linia to nazwy kolumn)
                    - Linie zaczynające się od '#' są ignorowane (komentarze)
                    
                    **Wymagane kolumny (w dowolnej kolejności):**
                    - **item_id** (Long) - ID produktu
                    - **rack_id** (Long) - ID regału
                    - **position_x** (Integer) - Pozycja X na regale (1-based)
                    - **position_y** (Integer) - Pozycja Y na regale (1-based)
                    
                    **Opcjonalne kolumny:**
                    - **expires_at** (Timestamp) - Data wygaśnięcia (format: yyyy-MM-dd lub ISO 8601)
                    
                    **Przykład pliku CSV:**
                    ```
                    item_id;rack_id;position_x;position_y;expires_at
                    1;1;1;1;2026-12-31
                    2;1;1;2;2026-06-30
                    3;2;2;3;
                    ```
                    
                    **Uwagi:**
                    - Kolejność kolumn może być dowolna (nagłówek określa mapowanie)
                    - Pusta wartość dla expires_at oznacza brak ograniczenia czasowego
                    - System automatycznie wygeneruje barcode dla przypisania (GS1-128)
                    
                    **Walidacja pliku:**
                    - Tylko pliki CSV (rozszerzenia: .csv, .txt)
                    - Content-Type: text/csv, text/plain, application/csv
                    - Maksymalny rozmiar: 5MB
                    - Plik nie może być pusty
                    
                    **Odpowiedź:**
                    - `processedLines` - liczba przetworzonych linii
                    - `imported` - liczba zaimportowanych przypisań
                    - `errors` - lista błędów (jeśli wystąpiły)
                    """
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Import report with statistics",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessAssortmentImport.class))
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
    @PostMapping(value = "/import", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<AssortmentImportReport>> importAssortments(
            @RequestPart("file") MultipartFile file) {
        return ResponseEntity.ok(ResponseTemplate.success(assortmentImportService.importFromCsv(file)));
    }

    @Operation(summary = "Get assortment by code (GS1-128 barcode)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - returns assortment by code",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AssortmentDto.class))),
            @ApiResponse(responseCode = "404", description = "Error codes: ASSORTMENT_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @GetMapping("/code/{code}")
    public ResponseEntity<ResponseTemplate<AssortmentDto>> getAssortmentByCode(@PathVariable String code, HttpServletRequest request) {
        try {
            return ResponseEntity.ok(ResponseTemplate.success(assortmentService.getAssortmentByCode(code, request)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ResponseTemplate.error(e.getMessage()));
        }
    }
}
