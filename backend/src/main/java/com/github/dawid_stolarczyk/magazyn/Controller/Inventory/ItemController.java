package com.github.dawid_stolarczyk.magazyn.Controller.Inventory;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ItemDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ItemImportReport;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ResponseTemplate;
import com.github.dawid_stolarczyk.magazyn.Services.ImportExport.ItemImportService;
import com.github.dawid_stolarczyk.magazyn.Services.Inventory.ItemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/items")
@Tag(name = "Items", description = "Endpoints for managing products and their photos")
@RequiredArgsConstructor
public class ItemController {
    private final ItemService itemService;
    private final ItemImportService itemImportService;

    @Operation(
            summary = "Get all items",
            description = "Returns list of all products available in the system"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Successfully retrieved list of items",
            content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessData.class))
    )
    @GetMapping
    public ResponseEntity<ResponseTemplate<List<ItemDto>>> getAllItems(HttpServletRequest request) {
        return ResponseEntity.ok(ResponseTemplate.success(itemService.getAllItems(request)));
    }

    @Operation(
            summary = "Get item by ID",
            description = "Returns detailed information about a specific product by its database ID"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Successfully retrieved item data",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessData.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Item with specified ID not found",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))
            )
    })
    @GetMapping("/{id}")
    public ResponseEntity<ResponseTemplate<ItemDto>> getItemById(@PathVariable Long id, HttpServletRequest request) {
        try {
            return ResponseEntity.ok(ResponseTemplate.success(itemService.getItemById(id, request)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ResponseTemplate.error(e.getMessage()));
        }
    }

    @Operation(
            summary = "Get item by barcode",
            description = """
                    Returns detailed product information by its 6-digit barcode (GS1-128 compatible).
                    This endpoint is useful for barcode scanning operations.
                    """
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Successfully retrieved item data with photo URL if available",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessData.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Item with specified barcode not found",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))
            )
    })
    @GetMapping("/barcode/{barcode}")
    public ResponseEntity<ResponseTemplate<ItemDto>> getItemByBarcode(@PathVariable String barcode, HttpServletRequest request) {
        try {
            return ResponseEntity.ok(ResponseTemplate.success(itemService.getItemByBarcode(barcode, request)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ResponseTemplate.error(e.getMessage()));
        }
    }

    @Operation(
            summary = "Create a new item",
            description = """
                    Creates a new product in the system. Requires ADMIN role.
                    Barcode is generated automatically (6-digit code compatible with GS1-128).
                    """
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "201",
                    description = "Item created successfully",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessData.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid input data (validation failed)",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Access denied - requires ADMIN role",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))
            )
    })
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<ItemDto>> createItem(@RequestBody ItemDto dto, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ResponseTemplate.success(itemService.createItem(dto, request)));
    }

    @Operation(
            summary = "Update an existing item",
            description = """
                    Updates product information. Requires ADMIN role.
                    Barcode cannot be changed through this endpoint.
                    """
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Item updated successfully",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessData.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid input data",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Item with specified ID not found",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Access denied - requires ADMIN role",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))
            )
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<ItemDto>> updateItem(@PathVariable Long id, @RequestBody ItemDto dto, HttpServletRequest request) {
        return ResponseEntity.ok(ResponseTemplate.success(itemService.updateItem(id, dto, request)));
    }

    @Operation(
            summary = "Delete an item",
            description = """
                    Permanently deletes a product from the system. Requires ADMIN role.
                    Associated photo will also be deleted from storage.
                    """
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Item deleted successfully",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Item with specified ID not found",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Access denied - requires ADMIN role",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))
            )
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<Void>> deleteItem(@PathVariable Long id, HttpServletRequest request) {
        itemService.deleteItem(id, request);
        return ResponseEntity.ok(ResponseTemplate.success());
    }

    @Operation(
            summary = "Upload item photo",
            description = """
                    Uploads an encrypted photo for a product to S3-compatible storage. Requires ADMIN role.
                    Only image files (JPEG, PNG, WebP) are accepted.
                    Previous photo (if exists) will be automatically deleted.
                    """
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Photo uploaded successfully - returns S3 file path",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessData.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid file format or item not found",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Access denied - requires ADMIN role",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "Failed to upload photo to storage",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))
            )
    })
    @PostMapping(value = "/{id}/photo", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<String>> uploadPhoto(@PathVariable Long id, @RequestPart("file") MultipartFile file, HttpServletRequest request) {
        try {
            return ResponseEntity.ok(ResponseTemplate.success(itemService.uploadPhoto(id, file, request)));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid photo upload request for item {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ResponseTemplate.error(e.getMessage()));
        } catch (IllegalStateException e) {
            log.error("Storage state error while uploading photo for item {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ResponseTemplate.error("PHOTO_UPLOAD_FAILED"));
        } catch (Exception e) {
            log.error("Unexpected error uploading photo for item {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ResponseTemplate.error("PHOTO_UPLOAD_FAILED"));
        }
    }

    @Operation(
            summary = "Download item photo",
            description = """
                    Downloads and decrypts the product photo from S3-compatible storage.
                    Returns raw binary image data.
                    """
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Successfully retrieved decrypted photo - binary image data"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Photo not found or item does not have a photo"
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "Failed to download or decrypt photo"
            )
    })
    @GetMapping(value = "/{id}/photo", produces = MediaType.IMAGE_JPEG_VALUE)
    public ResponseEntity<byte[]> downloadPhoto(@PathVariable Long id, HttpServletRequest request) {
        try {
            byte[] data = itemService.downloadPhoto(id, request);
            return ResponseEntity.ok(data);
        } catch (IllegalArgumentException e) {
            log.warn("Photo not found for item {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (IllegalStateException e) {
            log.error("Storage state error while downloading photo for item {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (Exception e) {
            log.error("Unexpected error downloading photo for item {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Operation(
            summary = "Import items (products) from CSV",
            description = """
                    Import produktów z pliku CSV ze **stałą kolejnością kolumn** (bez nagłówka).
                    
                    **Format CSV:**
                    - Separator: **średnik (;)**
                    - Kodowanie: **UTF-8**
                    - **Bez nagłówka** (pierwsza linia to już dane)
                    - Linie zaczynające się od '#' są ignorowane (komentarze)
                    - Przecinki w wartościach są bezpieczne (np. "Mleko 3,2%")
                    
                    **Kolejność kolumn (STAŁA):**
                    1. **Nazwa** (String) - Nazwa produktu
                       - WYMAGANE
                    2. **TempMin** (Float) - Minimalna temperatura przechowywania w °C
                       - WYMAGANE
                    3. **TempMax** (Float) - Maksymalna temperatura przechowywania w °C
                       - WYMAGANE
                    4. **Waga** (Float) - Waga produktu w kilogramach
                       - WYMAGANE
                    5. **SzerokoscMm** (Float) - Szerokość produktu w milimetrach
                       - WYMAGANE
                    6. **WysokoscMm** (Float) - Wysokość produktu w milimetrach
                       - WYMAGANE
                    7. **GlebokoscMm** (Float) - Głębokość produktu w milimetrach
                       - WYMAGANE
                    8. **TerminWaznosciDni** (Integer) - Termin ważności w dniach
                       - OPCJONALNE
                    9. **CzyNiebezpieczny** (Boolean) - TRUE/FALSE - czy produkt jest niebezpieczny
                       - OPCJONALNE (domyślnie FALSE)
                    10. **Komentarz** (String) - Dodatkowy opis produktu
                        - OPCJONALNE
                    
                    **Przykład pliku CSV:**
                    ```
                    #Nazwa;TempMin;TempMax;Waga;SzerokoscMm;WysokoscMm;GlebokoscMm;TerminWaznosciDni;CzyNiebezpieczny;Komentarz
                    Mleko 3,2%;2;6;1.0;20;7;7;14;FALSE;Przechowywać w lodówce
                    Lody waniliowe;-18;-12;0.5;15;10;8;180;FALSE;Produkt mrożony
                    Aceton techniczny;10;25;2.5;30;20;15;365;TRUE;Substancja łatwopalna
                    ```
                    
                    **Uwagi:**
                    - Barcode produktu jest generowany automatycznie (6-cyfrowy kod produktu zgodny z GS1-128)
                    - Zdjęcia należy uploadować osobno przez endpoint POST /items/{id}/photo
                    - Wartości NULL lub puste dla kolumn opcjonalnych są ignorowane
                    
                    **Walidacja pliku:**
                    - Tylko pliki CSV (rozszerzenia: .csv, .txt)
                    - Content-Type: text/csv, text/plain, application/csv
                    - Maksymalny rozmiar: 5MB
                    - Plik nie może być pusty
                    
                    **Odpowiedź:**
                    - `processedLines` - liczba przetworzonych linii
                    - `imported` - liczba zaimportowanych produktów
                    - `errors` - lista błędów (jeśli wystąpiły)
                    """
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Import report with statistics",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessItemImport.class))
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
    public ResponseEntity<ResponseTemplate<ItemImportReport>> importItems(
            @RequestPart("file") MultipartFile file) {
        return ResponseEntity.ok(ResponseTemplate.success(itemImportService.importFromCsv(file)));
    }
}
