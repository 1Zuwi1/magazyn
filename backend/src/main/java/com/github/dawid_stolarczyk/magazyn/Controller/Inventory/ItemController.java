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

    @Operation(summary = "Get all items")
    @ApiResponse(responseCode = "200", description = "List of all items",
            content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessData.class)))
    @GetMapping
    public ResponseEntity<ResponseTemplate<List<ItemDto>>> getAllItems() {
        return ResponseEntity.ok(ResponseTemplate.success(itemService.getAllItems()));
    }

    @Operation(summary = "Get item by ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Item data",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessData.class))),
            @ApiResponse(responseCode = "404", description = "Item not found",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<ResponseTemplate<ItemDto>> getItemById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(ResponseTemplate.success(itemService.getItemById(id)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ResponseTemplate.error(e.getMessage()));
        }
    }

    @Operation(summary = "Create a new item")
    @ApiResponse(responseCode = "201", description = "Item created successfully",
            content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessData.class)))
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<ItemDto>> createItem(@RequestBody ItemDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ResponseTemplate.success(itemService.createItem(dto)));
    }

    @Operation(summary = "Update an item")
    @ApiResponse(responseCode = "200", description = "Item updated successfully",
            content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessData.class)))
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<ItemDto>> updateItem(@PathVariable Long id, @RequestBody ItemDto dto) {
        return ResponseEntity.ok(ResponseTemplate.success(itemService.updateItem(id, dto)));
    }

    @Operation(summary = "Delete an item")
    @ApiResponse(responseCode = "200", description = "Item deleted successfully",
            content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class)))
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<Void>> deleteItem(@PathVariable Long id) {
        itemService.deleteItem(id);
        return ResponseEntity.ok(ResponseTemplate.success());
    }

    @Operation(summary = "Upload item photo")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Photo uploaded",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessData.class))),
            @ApiResponse(responseCode = "400", description = "Invalid file or item not found",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping(value = "/{id}/photo", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<String>> uploadPhoto(@PathVariable Long id, @RequestPart("file") MultipartFile file) {
        try {
            return ResponseEntity.ok(ResponseTemplate.success(itemService.uploadPhoto(id, file)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ResponseTemplate.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Failed to upload photo for item {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ResponseTemplate.error("PHOTO_UPLOAD_FAILED"));
        }
    }

    @Operation(summary = "Download item photo")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Binary photo data content"),
            @ApiResponse(responseCode = "404", description = "Photo or item not found")
    })
    @GetMapping(value = "/{id}/photo", produces = MediaType.IMAGE_JPEG_VALUE)
    public ResponseEntity<byte[]> downloadPhoto(@PathVariable Long id) {
        try {
            byte[] data = itemService.downloadPhoto(id);
            return ResponseEntity.ok(data);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Failed to download photo for item {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Operation(summary = "Import items from CSV")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Import report",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessItemImport.class))),
            @ApiResponse(responseCode = "400", description = "Invalid CSV file",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<ItemImportReport>> importItems(
            @RequestPart("file") MultipartFile file) {
        return ResponseEntity.ok(ResponseTemplate.success(itemImportService.importFromCsv(file)));
    }
}
