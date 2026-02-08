package com.github.dawid_stolarczyk.magazyn.Controller.Inventory;

import com.github.dawid_stolarczyk.magazyn.Common.ConfigurationConstants;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.*;
import com.github.dawid_stolarczyk.magazyn.Services.ImportExport.RackImportService;
import com.github.dawid_stolarczyk.magazyn.Services.Inventory.AssortmentService;
import com.github.dawid_stolarczyk.magazyn.Services.Inventory.RackService;
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

@RestController
@RequestMapping("/racks")
@Tag(name = "Racks", description = "Endpoints for managing warehouse racks")
@RequiredArgsConstructor
public class RackController {
    private final RackService rackService;
    private final RackImportService rackImportService;
    private final AssortmentService assortmentService;

    @Operation(summary = "Get all racks with pagination")
    @ApiResponse(responseCode = "200", description = "Success",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseTemplate.PagedRacksResponse.class)))
    @GetMapping
    public ResponseEntity<ResponseTemplate<RackPagedResponse>> getAllRacks(
            HttpServletRequest request,
            @Parameter(description = "Page number (0-indexed)", example = "0") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size", example = "20") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort by field", example = "id") @RequestParam(defaultValue = "id") String sortBy,
            @Parameter(description = "Sort direction (asc/desc)", example = "asc") @RequestParam(defaultValue = "asc") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        PageRequest pageable = PageRequest.of(page, Math.min(size, ConfigurationConstants.MAX_PAGE_SIZE), sort);
        return ResponseEntity.ok(ResponseTemplate.success(
                rackService.getAllRacksPaged(request, pageable)));
    }

    @Operation(summary = "Get rack by ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = RackDto.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: RACK_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<ResponseTemplate<RackDto>> getRackById(@PathVariable Long id, HttpServletRequest request) {
        return ResponseEntity.ok(ResponseTemplate.success(rackService.getRackById(id, request)));
    }

    @Operation(summary = "Get assortment in a rack with pagination and filters",
            description = "Returns paginated list of all assortments stored in a specific rack, including full item details. Supports filtering by item name/code and week to expire status")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseTemplate.PagedAssortmentsWithItemResponse.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: RACK_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @GetMapping("/{rackId}/assortments")
    public ResponseEntity<ResponseTemplate<PagedResponse<AssortmentWithItemDto>>> getItemsByRackId(
            @PathVariable Long rackId,
            HttpServletRequest request,
            @Parameter(description = "Page number (0-indexed)", example = "0") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size", example = "20") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort by field", example = "id") @RequestParam(defaultValue = "id") String sortBy,
            @Parameter(description = "Sort direction (asc/desc)", example = "asc") @RequestParam(defaultValue = "asc") String sortDir,
            @Parameter(description = "Search by item name or code (case-insensitive)", example = "milk") @RequestParam(required = false) String search,
            @Parameter(description = "Filter by week to expire (expires within 7 days)", example = "true") @RequestParam(required = false) Boolean weekToExpire) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        PageRequest pageable = PageRequest.of(page, Math.min(size, ConfigurationConstants.MAX_PAGE_SIZE), sort);
        return ResponseEntity.ok(ResponseTemplate.success(
                PagedResponse.from(assortmentService.getAssortmentsByRackIdPaged(rackId, request, pageable, search, weekToExpire))));
    }

    @Operation(summary = "Create rack (ADMIN only)",
            description = "Creates a new rack with physical properties. Statistics (occupiedSlots, freeSlots, totalSlots) are computed automatically.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Success - returns created rack with computed statistics",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = RackDto.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: INVALID_INPUT, WAREHOUSE_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<RackDto>> createRack(@Valid @RequestBody RackCreateRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ResponseTemplate.success(rackService.createRack(request, httpRequest)));
    }

    @Operation(summary = "Update rack (ADMIN only)",
            description = "Updates rack properties. Statistics are recomputed automatically.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - returns updated rack with computed statistics",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = RackDto.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: RACK_NOT_FOUND, WAREHOUSE_NOT_FOUND, INVALID_INPUT",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<RackDto>> updateRack(@PathVariable Long id, @Valid @RequestBody RackUpdateRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ResponseTemplate.success(rackService.updateRack(id, request, httpRequest)));
    }

    @Operation(summary = "Delete a rack (ADMIN only)")
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

    @Operation(
            summary = "Import racks from CSV (ADMIN only)",
            description = """
                    Import regałów z pliku CSV ze **stałą kolejnością kolumn** (bez nagłówka).
                    Wszystkie importowane regały będą przypisane do magazynu określonego przez parametr warehouseId.
                    
                    **Format CSV:**
                    - Separator: **średnik (;)**
                    - Kodowanie: **UTF-8**
                    - Bez nagłówka (pierwsza linia to już dane)
                    - Linie zaczynające się od '#' są ignorowane (komentarze)
                    
                    **Kolejność kolumn (STAŁA):**
                    1. **Marker** (String) - Oznaczenie regału (np. R-01, A-01)
                       - WYMAGANE, automatycznie normalizowane do wielkich liter
                       - Musi być unikalny w ramach magazynu
                    2. **M** (Integer) - Liczba pozycji w osi X (szerokość regału)
                       - Min: 1, Max: 1000
                       - WYMAGANE
                    3. **N** (Integer) - Liczba pozycji w osi Y (głębokość regału)
                       - Min: 1, Max: 1000
                       - WYMAGANE
                    4. **TempMin** (Float) - Minimalna temperatura w °C
                       - WYMAGANE
                    5. **TempMax** (Float) - Maksymalna temperatura w °C
                       - WYMAGANE
                    6. **MaxWagaKg** (Float) - Maksymalna waga w kilogramach
                       - WYMAGANE
                    7. **MaxSzerokoscMm** (Float) - Maksymalna szerokość przedmiotu w milimetrach
                       - WYMAGANE
                    8. **MaxWysokoscMm** (Float) - Maksymalna wysokość przedmiotu w milimetrach
                       - WYMAGANE
                    9. **MaxGlebokoscMm** (Float) - Maksymalna głębokość przedmiotu w milimetrach
                       - WYMAGANE
                    10. **AcceptsDangerous** (Boolean) - TRUE/FALSE - czy regał akceptuje niebezpieczne produkty
                        - OPCJONALNE (domyślnie FALSE)
                    11. **Komentarz** (String) - Dodatkowy opis
                        - OPCJONALNE
                    
                    **Przykład pliku CSV:**
                    ```
                    #Marker;M;N;TempMin;TempMax;MaxWagaKg;MaxSzerokoscMm;MaxWysokoscMm;MaxGlebokoscMm;AcceptsDangerous;Komentarz
                    R-01;5;10;0;5;1200;200;300;500;FALSE;Regał chłodniczy
                    R-02;4;8;0;40;800;150;250;400;FALSE;Regał standardowy
                    R-03;6;12;-20;-5;1500;180;350;600;FALSE;Regał mroźniczy
                    R-04;3;6;10;60;500;300;400;700;TRUE;Regał na materiały niebezpieczne
                    ```
                    
                    **Uwagi:**
                    - Marker jest automatycznie normalizowany (uppercase, usunięcie znaków specjalnych)
                    - Marker musi być unikalny w ramach jednego magazynu
                    - Wszystkie regały będą przypisane do magazynu określonego parametrem warehouseId
                    - Wartości NULL lub puste dla kolumn opcjonalnych są ignorowane
                    
                    **Walidacja pliku:**
                    - Tylko pliki CSV (rozszerzenia: .csv, .txt)
                    - Content-Type: text/csv, text/plain, application/csv
                    - Maksymalny rozmiar: 5MB
                    - Plik nie może być pusty
                    
                    **Odpowiedź:**
                    - `processedLines` - liczba przetworzonych linii
                    - `imported` - liczba zaimportowanych regałów
                    - `errors` - lista błędów (jeśli wystąpiły)
                    """
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Import report with statistics",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessRackImport.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid CSV file, validation errors, or warehouse not found",
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
    public ResponseEntity<ResponseTemplate<RackImportReport>> importRacks(
            @Parameter(description = "Warehouse ID to assign all imported racks to", required = true, example = "1")
            @RequestParam("warehouseId") Long warehouseId,
            @RequestParam("file") MultipartFile file
    ) {
        return ResponseEntity.ok(ResponseTemplate.success(rackImportService.importFromCsv(warehouseId, file)));
    }
}
