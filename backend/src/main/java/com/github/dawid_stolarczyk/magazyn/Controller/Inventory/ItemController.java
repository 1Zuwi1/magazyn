package com.github.dawid_stolarczyk.magazyn.Controller.Inventory;

import com.github.dawid_stolarczyk.magazyn.Common.ConfigurationConstants;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.*;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.UserRepository;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.AuthUtil;
import com.github.dawid_stolarczyk.magazyn.Services.Ai.ItemEmbeddingGenerationService;
import com.github.dawid_stolarczyk.magazyn.Services.Ai.VisualIdentificationService;
import com.github.dawid_stolarczyk.magazyn.Services.ImportExport.ItemImportService;
import com.github.dawid_stolarczyk.magazyn.Services.Inventory.ItemService;
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
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
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
    private final VisualIdentificationService visualIdentificationService;
    private final ItemEmbeddingGenerationService embeddingGenerationService;
    private final UserRepository userRepository;

    @Operation(summary = "Get all items with pagination and filters",
            description = "Retrieve items with optional filters for name/code search, dangerous status, temperature ranges, weight, and expiration days")
    @ApiResponse(responseCode = "200", description = "Success",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = ResponseTemplate.PagedItemsResponse.class)))
    @GetMapping
    public ResponseEntity<ResponseTemplate<PagedResponse<ItemDto>>> getAllItems(
            HttpServletRequest request,
            @Parameter(description = "Page number (0-indexed)", example = "0") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size", example = "20") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort by field", example = "id") @RequestParam(defaultValue = "id") String sortBy,
            @Parameter(description = "Sort direction (asc/desc)", example = "asc") @RequestParam(defaultValue = "asc") String sortDir,
            @Parameter(description = "Search by name or code (case-insensitive)", example = "milk") @RequestParam(required = false) String search,
            @Parameter(description = "Filter by dangerous status", example = "true") @RequestParam(required = false) Boolean dangerous,
            @Parameter(description = "Minimum temperature range - from", example = "-20") @RequestParam(required = false) Float minTempFrom,
            @Parameter(description = "Minimum temperature range - to", example = "5") @RequestParam(required = false) Float minTempTo,
            @Parameter(description = "Maximum temperature range - from", example = "0") @RequestParam(required = false) Float maxTempFrom,
            @Parameter(description = "Maximum temperature range - to", example = "25") @RequestParam(required = false) Float maxTempTo,
            @Parameter(description = "Weight range - from (kg)", example = "0.5") @RequestParam(required = false) Float weightFrom,
            @Parameter(description = "Weight range - to (kg)", example = "10") @RequestParam(required = false) Float weightTo,
            @Parameter(description = "Expire after days range - from", example = "7") @RequestParam(required = false) Long expireAfterDaysFrom,
            @Parameter(description = "Expire after days range - to", example = "365") @RequestParam(required = false) Long expireAfterDaysTo) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        PageRequest pageable = PageRequest.of(page, Math.min(size, ConfigurationConstants.MAX_PAGE_SIZE), sort);
        return ResponseEntity.ok(ResponseTemplate.success(
                PagedResponse.from(itemService.getAllItemsPaged(request, pageable, search, dangerous,
                        minTempFrom, minTempTo, maxTempFrom, maxTempTo, weightFrom, weightTo,
                        expireAfterDaysFrom, expireAfterDaysTo))));
    }

    @Operation(summary = "Get item by ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ItemDto.class))),
            @ApiResponse(responseCode = "404", description = "Error codes: ITEM_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<ResponseTemplate<ItemDto>> getItemById(@PathVariable Long id, HttpServletRequest request) {
        try {
            return ResponseEntity.ok(ResponseTemplate.success(itemService.getItemById(id, request)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ResponseTemplate.error(e.getMessage()));
        }
    }

    @Operation(summary = "Get item by code or QR code", description = "Accepts either 16-digit GS1-128 barcode with 01 prefix or QR code (format: QR-XXXXX)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ItemDto.class))),
            @ApiResponse(responseCode = "404", description = "Error codes: ITEM_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @GetMapping("/code/{code}")
    public ResponseEntity<ResponseTemplate<ItemDto>> getItemByCode(@PathVariable String code, HttpServletRequest request) {
        try {
            return ResponseEntity.ok(ResponseTemplate.success(itemService.getItemByCode(code, request)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ResponseTemplate.error(e.getMessage()));
        }
    }

    @Operation(summary = "Create item (ADMIN only)",
            description = "Creates a new item with physical properties only. Name is optional. GS1-128 barcode code is auto-generated (16-digit with 01 prefix).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Success - returns created item with generated barcode code",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ItemDto.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: INVALID_INPUT",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<ItemDto>> createItem(@Valid @RequestBody ItemCreateRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ResponseTemplate.success(itemService.createItem(request, httpRequest)));
    }

    @Operation(
            summary = "Update an existing item (ADMIN only)",
            description = """
                    Updates product physical properties. Name is optional. Requires ADMIN role.
                    Code (barcode) and photo cannot be changed through this endpoint.
                    """
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Item updated successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ItemDto.class))
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
    public ResponseEntity<ResponseTemplate<ItemDto>> updateItem(@PathVariable Long id, @Valid @RequestBody ItemUpdateRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ResponseTemplate.success(itemService.updateItem(id, request, httpRequest)));
    }

    @Operation(
            summary = "Delete an item (ADMIN only)",
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
            summary = "Batch upload item photos (ADMIN only)",
            description = """
                    Uploads multiple photos and matches them to items by filename.
                    Photos are encrypted and uploaded to S3.
                    Items are matched by their photo_url field set during CSV import.
                    Only items with matching photo_url are updated.
                    
                    **Process:**
                    1. Each photo filename is matched against item.photo_url
                    2. If match found, photo is encrypted and uploaded to S3
                    3. item.photo_url is updated to encrypted file name
                    4. item.imageUploaded is set to true
                    5. Image embedding is generated if model is available
                    
                    **Response format:** List of strings with results:
                    - "UPLOADED: filename.jpg -> item_id=123"
                    - "NOT_FOUND: filename.jpg"
                    - "FAILED: filename.jpg - error message"
                    
                    **Authentication:** Requires ADMIN role
                    """
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Batch upload completed successfully",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid file format or processing error",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Access denied - requires ADMIN role",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "Internal server error during upload",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.class))
            )
    })
    @PostMapping(value = "/photos/batch-upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<List<String>>> uploadPhotosBatch(
            @RequestPart("files") List<MultipartFile> files) {
        try {
            List<String> results = itemService.uploadPhotosBatch(files);
            return ResponseEntity.ok(ResponseTemplate.success(results));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid photo batch upload: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseTemplate.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error during photo batch upload", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseTemplate.error("BATCH_UPLOAD_FAILED"));
        }
    }

    @Operation(summary = "Upload multiple photos for item (ADMIN only)",
            description = "Uploads multiple photos to the item's image gallery. Max 10 images per item.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Photos uploaded successfully"),
            @ApiResponse(responseCode = "400", description = "Error codes: MAX_IMAGES_EXCEEDED, FILE_IS_EMPTY, INVALID_FILE_TYPE"),
            @ApiResponse(responseCode = "404", description = "Error codes: ITEM_NOT_FOUND")
    })
    @PostMapping(value = "/{id}/photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<List<ItemImageDto>>> uploadMultiplePhotos(
            @PathVariable Long id,
            @RequestPart("files") List<MultipartFile> files,
            HttpServletRequest request) {
        try {
            List<ItemImageDto> result = itemService.uploadMultiplePhotos(id, files, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(ResponseTemplate.success(result));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid photos upload for item {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ResponseTemplate.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error uploading photos for item {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ResponseTemplate.error("PHOTO_UPLOAD_FAILED"));
        }
    }

    @Operation(summary = "Get all photos for an item",
            description = "Returns metadata for all photos in the item's gallery, ordered by display order.")
    @ApiResponse(responseCode = "200", description = "List of item images")
    @GetMapping("/{id}/photos")
    public ResponseEntity<ResponseTemplate<List<ItemImageDto>>> getItemPhotos(
            @PathVariable Long id,
            HttpServletRequest request) {
        try {
            return ResponseEntity.ok(ResponseTemplate.success(itemService.getItemPhotos(id, request)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ResponseTemplate.error(e.getMessage()));
        }
    }

    @Operation(summary = "Download a specific photo by image ID",
            description = "Downloads and decrypts a specific photo from the item's gallery.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Photo downloaded successfully"),
            @ApiResponse(responseCode = "404", description = "Error codes: IMAGE_NOT_FOUND")
    })
    @GetMapping(value = "/{id}/photos/{imageId}", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> downloadPhotoByImageId(
            @PathVariable Long id,
            @PathVariable Long imageId,
            HttpServletRequest request) {
        try {
            byte[] data = itemService.downloadPhotoByImageId(id, imageId, request);
            return ResponseEntity.ok(data);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error downloading photo {} for item {}", imageId, id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Operation(summary = "Delete a specific photo (ADMIN only)",
            description = "Deletes a photo from the item's gallery. If the deleted image was primary, the next image is auto-promoted.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Photo deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Error codes: ITEM_NOT_FOUND, IMAGE_NOT_FOUND")
    })
    @DeleteMapping("/{id}/photos/{imageId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<Void>> deletePhoto(
            @PathVariable Long id,
            @PathVariable Long imageId,
            HttpServletRequest request) {
        try {
            itemService.deletePhoto(id, imageId, request);
            return ResponseEntity.ok(ResponseTemplate.success());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ResponseTemplate.error(e.getMessage()));
        }
    }

    @Operation(summary = "Set a photo as primary (ADMIN only)",
            description = "Sets the specified photo as the primary image for the item.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Primary photo updated"),
            @ApiResponse(responseCode = "404", description = "Error codes: ITEM_NOT_FOUND, IMAGE_NOT_FOUND")
    })
    @PutMapping("/{id}/photos/{imageId}/primary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<Void>> setPrimaryPhoto(
            @PathVariable Long id,
            @PathVariable Long imageId,
            HttpServletRequest request) {
        try {
            itemService.setPrimaryPhoto(id, imageId, request);
            return ResponseEntity.ok(ResponseTemplate.success());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ResponseTemplate.error(e.getMessage()));
        }
    }

    @Operation(
            summary = "Import items (products) from CSV (ADMIN only)",
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
                    2. **Id** (String) - Identyfikator (GS1-128 barcode lub QR code)
                       - OPCJONALNE (generowane automatycznie jeśli puste)
                    3. **Zdjecie** (String) - Nazwa pliku zdjęcia (do dopasowania przy batch upload)
                       - OPCJONALNE
                       - Nazwa musi być unikalna w całej bazie danych
                       - Przy uploadzie batch, nazwa pliku musi pasować do tej wartości
                       - Jeśli podano, `imageUploaded` jest ustawiane na false
                    4. **TempMin** (Float) - Minimalna temperatura przechowywania w °C
                       - WYMAGANE
                    5. **TempMax** (Float) - Maksymalna temperatura przechowywania w °C
                       - WYMAGANE
                    6. **Waga** (Float) - Waga produktu w kilogramach
                       - WYMAGANE
                    7. **SzerokoscMm** (Float) - Szerokość produktu w milimetrach
                       - WYMAGANE
                    8. **WysokoscMm** (Float) - Wysokość produktu w milimetrach
                       - WYMAGANE
                    9. **GlebokoscMm** (Float) - Głębokość produktu w milimetrach
                       - WYMAGANE
                    10. **Komentarz** (String) - Dodatkowy opis produktu
                        - OPCJONALNE
                    11. **TerminWaznosciDni** (Integer) - Termin ważności w dniach
                        - OPCJONALNE
                    12. **CzyNiebezpieczny** (Boolean) - TRUE/FALSE - czy produkt jest niebezpieczny
                        - OPCJONALNE (domyślnie FALSE)

                    **Przykład pliku CSV:**
                    ```
                    #Nazwa;Id;Zdjecie;TempMin;TempMax;Waga;SzerokoscMm;WysokoscMm;GlebokoscMm;Komentarz;TerminWaznosciDni;CzyNiebezpieczny
                    Mleko 3,2%;;mleko.jpg;2;6;1.0;20;7;7;Przechowywać w lodówce;14;FALSE
                    Lody waniliowe;;lody.png;-18;-12;0.5;15;10;8;Produkt mrożony;180;FALSE
                    Aceton techniczny;;aceton.jpg;10;25;2.5;30;20;15;Substancja łatwopalna;365;TRUE
                    ```

                    **Workflow uploadu zdjęć:**
                    1. Import CSV z nazwami zdjęć w kolumnie "Zdjecie"
                    2. Użyj endpointu POST /items/photos/batch-upload z plikami zdjęć
                    3. Zdjęcia są dopasowywane do produktów po nazwie pliku
                    4. Po dopasowaniu, zdjęcia są szyfrowane i uploadowane na S3
                    5. `imageUploaded` jest ustawiane na true

                    **Uwagi:**
                    - GS1-128 barcode code produktu jest generowany automatycznie (16-cyfrowy kod produktu z prefiksem 01)
                    - Nazwy zdjęć muszą być unikalne - powtórzenia powodują błąd importu
                    - Zdjęcia nie są wymagane przy imporcie - można je dodać później

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

    @Operation(
            summary = "Identify item by image (visual search)",
            description = """
                    Identifies a product by uploading an image for visual similarity search.
                    Uses image embeddings and compares against stored item embeddings using cosine similarity.
                    
                    **Authentication required:** This endpoint requires a valid user session.
                    
                    **Tiered confidence strategy:**
                    - **HIGH_CONFIDENCE** (score >= 0.9): Single best match returned
                    - **NEEDS_VERIFICATION** (0.7 <= score < 0.9): Single match with verification flag
                    - **LOW_CONFIDENCE** (score < 0.7): Top-5 candidates returned for user selection
                    
                    **Mismatch flow:** The response includes an `identificationId` that can be used
                    with the `/identify/mismatch` endpoint to reject a match and get alternatives.
                    
                    **Supported formats:** JPEG, PNG, GIF, WebP, BMP
                    **Maximum file size:** 10MB
                    """
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Item identified successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ItemIdentificationResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid image file or processing error",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Authentication required",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "503",
                    description = "AI model not available",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))
            )
    })
    @PostMapping(value = "/identify", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseTemplate<ItemIdentificationResponse>> identifyItem(
            @Parameter(description = "Image file to identify", required = true)
            @RequestPart("file") MultipartFile file,
            HttpServletRequest request) {
        try {
            ItemIdentificationResponse response = visualIdentificationService.identifyItem(
                    file, resolveCurrentUser(), request);
            return ResponseEntity.ok(ResponseTemplate.success(response));

        } catch (VisualIdentificationService.VisualIdentificationException e) {
            log.warn("Visual identification failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseTemplate.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error during visual identification", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseTemplate.error("IDENTIFICATION_FAILED"));
        }
    }

    @Operation(
            summary = "Report mismatch and get alternative candidates",
            description = """
                    When a user rejects a visual identification match, this endpoint
                    returns alternative candidates excluding the rejected item.
                    
                    **Authentication required:** This endpoint requires a valid user session.
                    
                    Requires the `identificationId` from the original `/identify` response
                    (valid for 15 minutes after the initial identification).
                    
                    Returns up to 3 alternative candidates ordered by similarity.
                    """
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Alternative candidates returned",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ItemIdentificationResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid request or expired identification session",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Authentication required",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))
            )
    })
    @PostMapping("/identify/mismatch")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseTemplate<ItemIdentificationResponse>> reportMismatch(
            @Valid @RequestBody MismatchFeedbackRequest feedbackRequest,
            HttpServletRequest request) {
        try {
            ItemIdentificationResponse response = visualIdentificationService.handleMismatch(
                    feedbackRequest.getIdentificationId(),
                    feedbackRequest.getRejectedItemId(),
                    resolveCurrentUser(),
                    request);
            return ResponseEntity.ok(ResponseTemplate.success(response));

        } catch (VisualIdentificationService.VisualIdentificationException e) {
            log.warn("Mismatch feedback failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseTemplate.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error during mismatch feedback", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseTemplate.error("MISMATCH_FEEDBACK_FAILED"));
        }
    }

    @Operation(
            summary = "Generate embeddings for items without embeddings (ADMIN only)",
            description = """
                    Batch generates image embeddings for all items with photos.
                    This operation runs asynchronously in the background.
                    Check server logs for progress and completion status.
                    
                    **forceRegenerate parameter:**
                    - `false` (default): Only generate embeddings for items that don't have them yet
                    - `true`: Regenerate embeddings for ALL items with photos (useful after model updates)
                    
                    **Process:**
                    1. Finds all items with photo_url (filtered by forceRegenerate flag)
                    2. Downloads each photo from S3
                    3. Generates embedding using the AI model with background removal
                    4. Saves embedding to database
                    
                    Returns 202 Accepted immediately. The operation continues in the background.
                    """
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "202",
                    description = "Embedding generation started in background",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Access denied - requires ADMIN role",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))
            )
    })
    @PostMapping("/generate-embeddings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<Void>> generateEmbeddings(
            @RequestParam(defaultValue = "false") boolean forceRegenerate) {
        log.info("Admin requested batch embedding generation (forceRegenerate={}) - starting async task", forceRegenerate);
        embeddingGenerationService.generateEmbeddingsAsync(forceRegenerate);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(ResponseTemplate.success());
    }

    private User resolveCurrentUser() {
        try {
            Long userId = AuthUtil.getCurrentUserId();
            if (userId != null) {
                return userRepository.findById(userId).orElse(null);
            }
        } catch (Exception e) {
            log.debug("No authenticated user for request");
        }
        return null;
    }
}
