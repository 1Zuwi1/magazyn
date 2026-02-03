package com.github.dawid_stolarczyk.magazyn.Controller.Inventory;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.RackDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.RackImportReport;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ResponseTemplate;
import com.github.dawid_stolarczyk.magazyn.Services.ImportExport.RackImportService;
import com.github.dawid_stolarczyk.magazyn.Services.Inventory.RackService;
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
    @ApiResponse(responseCode = "200", description = "Success - returns list of racks (id, marker, sizeX, sizeY, maxSizeX/Y/Z, minTemp, maxTemp, maxWeight, acceptsDangerous, warehouseId, comment)",
            content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = RackDto.class))))
    @GetMapping
    public ResponseEntity<ResponseTemplate<List<RackDto>>> getAllRacks(HttpServletRequest request) {
        return ResponseEntity.ok(ResponseTemplate.success(rackService.getAllRacks(request)));
    }

    @Operation(summary = "Get racks by warehouse ID")
    @ApiResponse(responseCode = "200", description = "Success - returns list of racks in warehouse",
            content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = RackDto.class))))
    @GetMapping("/warehouse/{warehouseId}")
    public ResponseEntity<ResponseTemplate<List<RackDto>>> getRacksByWarehouse(@PathVariable Long warehouseId, HttpServletRequest request) {
        return ResponseEntity.ok(ResponseTemplate.success(rackService.getRacksByWarehouse(warehouseId, request)));
    }

    @Operation(summary = "Get rack by ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - returns rack details",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = RackDto.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: RACK_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<ResponseTemplate<RackDto>> getRackById(@PathVariable Long id, HttpServletRequest request) {
        return ResponseEntity.ok(ResponseTemplate.success(rackService.getRackById(id, request)));
    }

    @Operation(summary = "Create rack [ADMIN]")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Success - returns created rack",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = RackDto.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: INVALID_INPUT, WAREHOUSE_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<RackDto>> createRack(@Valid @RequestBody RackDto rackDto, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ResponseTemplate.success(rackService.createRack(rackDto, request)));
    }

    @Operation(summary = "Update rack [ADMIN]")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - returns updated rack",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = RackDto.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: RACK_NOT_FOUND, WAREHOUSE_NOT_FOUND, INVALID_INPUT",
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

    @Operation(
            summary = "Import racks from CSV",
            description = """
                    Import regałów z pliku CSV ze **stałą kolejnością kolumn** (bez nagłówka).
                    
                    **Format CSV:**
                    - Separator: **średnik (;)**
                    - Kodowanie: **UTF-8**
                    - Bez nagłówka (pierwsza linia to już dane)
                    - Linie zaczynające się od '#' są ignorowane (komentarze)
                    
                    **Kolejność kolumn (STAŁA):**
                    1. **Oznaczenie** (String) - Format: W{warehouse_id}-{marker}
                       - Przykład: W1-R-01 (warehouse ID=1, marker="R-01")
                       - WYMAGANE
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
                    #Oznaczenie;M;N;TempMin;TempMax;MaxWagaKg;MaxSzerokoscMm;MaxWysokoscMm;MaxGlebokoscMm;AcceptsDangerous;Komentarz
                    W1-R-01;5;10;0;5;1200;200;300;500;FALSE;Regał chłodniczy
                    W1-R-02;4;8;0;40;800;150;250;400;FALSE;Regał standardowy
                    W2-R-01;6;12;-20;-5;1500;180;350;600;FALSE;Regał mroźniczy
                    W2-R-02;3;6;10;60;500;300;400;700;TRUE;Regał na materiały niebezpieczne
                    ```
                    
                    **Uwagi:**
                    - Oznaczenie musi zawierać prefix warehouse: W{id}- (np. W1-R-01)
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
    public ResponseEntity<ResponseTemplate<RackImportReport>> importRacks(
            @RequestParam("file") MultipartFile file
    ) {
        return ResponseEntity.ok(ResponseTemplate.success(rackImportService.importFromCsv(file)));
    }
}
