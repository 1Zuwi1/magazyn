package com.github.dawid_stolarczyk.magazyn.Controller;

import com.github.dawid_stolarczyk.magazyn.Common.ConfigurationConstants;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.*;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report.ExpiryReportRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report.InventoryStockReportRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report.TemperatureAlertReportRequest;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.ApiKeyScope;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.ReportFormat;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.ReportType;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.Entity.ApiKeyPrincipal;
import com.github.dawid_stolarczyk.magazyn.Services.Inventory.AssortmentService;
import com.github.dawid_stolarczyk.magazyn.Services.Inventory.ItemService;
import com.github.dawid_stolarczyk.magazyn.Services.Inventory.RackService;
import com.github.dawid_stolarczyk.magazyn.Services.Inventory.WarehouseService;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.RateLimitOperation;
import com.github.dawid_stolarczyk.magazyn.Services.Report.ReportExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;

/**
 * External API for systems authenticated via API key (X-API-KEY header).
 * Each endpoint validates that the API key has the required scope and
 * enforces warehouse binding (if the key is bound to a specific warehouse).
 */
@RestController
@RequestMapping("/v1/external")
@Tag(name = "External API", description = "Read-only API for external systems and IoT integrations (requires X-API-KEY)")
@SecurityRequirement(name = "api-key")
@RequiredArgsConstructor
@Slf4j
public class ExternalApiController {

    private final ItemService itemService;
    private final AssortmentService assortmentService;
    private final RackService rackService;
    private final WarehouseService warehouseService;
    private final ReportExportService reportExportService;
    private final Bucket4jRateLimiter rateLimiter;

    // ==================== INVENTORY_READ: Items ====================

    @Operation(summary = "List items [INVENTORY_READ]",
            description = "Returns paginated list of items. Supports search by name/code.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success"),
            @ApiResponse(responseCode = "403", description = "INSUFFICIENT_SCOPE")
    })
    @GetMapping("/items")
    public ResponseEntity<ResponseTemplate<PagedResponse<ItemDto>>> getItems(
            HttpServletRequest request,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort by field") @RequestParam(defaultValue = "id") String sortBy,
            @Parameter(description = "Sort direction") @RequestParam(defaultValue = "asc") String sortDir,
            @Parameter(description = "Search by name or code") @RequestParam(required = false) String search) {
        ApiKeyPrincipal principal = requireScope(ApiKeyScope.INVENTORY_READ);
        rateLimiter.consumeOrThrow("apikey:" + principal.getApiKeyId(), RateLimitOperation.INVENTORY_READ);

        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        PageRequest pageable = PageRequest.of(page, Math.min(size, ConfigurationConstants.MAX_PAGE_SIZE), sort);
        return ResponseEntity.ok(ResponseTemplate.success(
                PagedResponse.from(itemService.getAllItemsPaged(request, pageable, search, null,
                        null, null, null, null, null, null, null, null))));
    }

    @Operation(summary = "Get item by ID [INVENTORY_READ]")
    @GetMapping("/items/{id}")
    public ResponseEntity<ResponseTemplate<ItemDto>> getItemById(
            @PathVariable Long id, HttpServletRequest request) {
        requireScope(ApiKeyScope.INVENTORY_READ);
        ApiKeyPrincipal principal = getApiKeyPrincipal();
        rateLimiter.consumeOrThrow("apikey:" + principal.getApiKeyId(), RateLimitOperation.INVENTORY_READ);
        try {
            return ResponseEntity.ok(ResponseTemplate.success(itemService.getItemById(id, request)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ResponseTemplate.error(e.getMessage()));
        }
    }

    @Operation(summary = "Get item by barcode or QR code [INVENTORY_READ]")
    @GetMapping("/items/code/{code}")
    public ResponseEntity<ResponseTemplate<ItemDto>> getItemByCode(
            @PathVariable String code, HttpServletRequest request) {
        requireScope(ApiKeyScope.INVENTORY_READ);
        ApiKeyPrincipal principal = getApiKeyPrincipal();
        rateLimiter.consumeOrThrow("apikey:" + principal.getApiKeyId(), RateLimitOperation.INVENTORY_READ);
        try {
            return ResponseEntity.ok(ResponseTemplate.success(itemService.getItemByCode(code, request)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ResponseTemplate.error(e.getMessage()));
        }
    }

    // ==================== INVENTORY_READ: Assortments ====================

    @Operation(summary = "List all assortments [INVENTORY_READ]",
            description = "Returns paginated list of all assortments. For warehouse-scoped data use /warehouses/{id}/assortments.")
    @GetMapping("/assortments")
    public ResponseEntity<ResponseTemplate<PagedResponse<AssortmentDto>>> getAssortments(
            HttpServletRequest request,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort by field") @RequestParam(defaultValue = "id") String sortBy,
            @Parameter(description = "Sort direction") @RequestParam(defaultValue = "asc") String sortDir,
            @Parameter(description = "Search by code") @RequestParam(required = false) String search) {
        ApiKeyPrincipal principal = requireScope(ApiKeyScope.INVENTORY_READ);
        rateLimiter.consumeOrThrow("apikey:" + principal.getApiKeyId(), RateLimitOperation.INVENTORY_READ);

        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        PageRequest pageable = PageRequest.of(page, Math.min(size, ConfigurationConstants.MAX_PAGE_SIZE), sort);

        return ResponseEntity.ok(ResponseTemplate.success(
                PagedResponse.from(assortmentService.getAllAssortmentsPaged(
                        request, pageable, new ArrayList<>(), search, null))));
    }

    @Operation(summary = "List assortments by warehouse [INVENTORY_READ]",
            description = "Returns paginated list of assortments in a specific warehouse with full item details.")
    @GetMapping("/warehouses/{warehouseId}/assortments")
    public ResponseEntity<ResponseTemplate<PagedResponse<AssortmentWithItemDto>>> getAssortmentsByWarehouse(
            @PathVariable Long warehouseId,
            HttpServletRequest request,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort by field") @RequestParam(defaultValue = "id") String sortBy,
            @Parameter(description = "Sort direction") @RequestParam(defaultValue = "asc") String sortDir,
            @Parameter(description = "Search by item name or code") @RequestParam(required = false) String search) {
        ApiKeyPrincipal principal = requireScope(ApiKeyScope.INVENTORY_READ);
        rateLimiter.consumeOrThrow("apikey:" + principal.getApiKeyId(), RateLimitOperation.INVENTORY_READ);

        enforceWarehouseBinding(principal, warehouseId);

        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        PageRequest pageable = PageRequest.of(page, Math.min(size, ConfigurationConstants.MAX_PAGE_SIZE), sort);
        return ResponseEntity.ok(ResponseTemplate.success(
                PagedResponse.from(assortmentService.getAssortmentsByWarehouseIdPaged(
                        warehouseId, request, pageable, new ArrayList<>(), search, null))));
    }

    @Operation(summary = "Get assortment by ID [INVENTORY_READ]")
    @GetMapping("/assortments/{id}")
    public ResponseEntity<ResponseTemplate<AssortmentDto>> getAssortmentById(
            @PathVariable Long id, HttpServletRequest request) {
        requireScope(ApiKeyScope.INVENTORY_READ);
        ApiKeyPrincipal principal = getApiKeyPrincipal();
        rateLimiter.consumeOrThrow("apikey:" + principal.getApiKeyId(), RateLimitOperation.INVENTORY_READ);
        try {
            return ResponseEntity.ok(ResponseTemplate.success(assortmentService.getAssortmentById(id, request)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ResponseTemplate.error(e.getMessage()));
        }
    }

    @Operation(summary = "Get assortment by barcode [INVENTORY_READ]")
    @GetMapping("/assortments/code/{code}")
    public ResponseEntity<ResponseTemplate<AssortmentDto>> getAssortmentByCode(
            @PathVariable String code, HttpServletRequest request) {
        requireScope(ApiKeyScope.INVENTORY_READ);
        ApiKeyPrincipal principal = getApiKeyPrincipal();
        rateLimiter.consumeOrThrow("apikey:" + principal.getApiKeyId(), RateLimitOperation.INVENTORY_READ);
        try {
            return ResponseEntity.ok(ResponseTemplate.success(assortmentService.getAssortmentByCode(code, request)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ResponseTemplate.error(e.getMessage()));
        }
    }

    // ==================== STRUCTURE_READ: Warehouses ====================

    @Operation(summary = "List warehouses [STRUCTURE_READ]",
            description = "Returns paginated list of warehouses. If the API key is bound to a warehouse, only that warehouse is returned.")
    @GetMapping("/warehouses")
    public ResponseEntity<ResponseTemplate<WarehousePagedResponse>> getWarehouses(
            HttpServletRequest request,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort by field") @RequestParam(defaultValue = "id") String sortBy,
            @Parameter(description = "Sort direction") @RequestParam(defaultValue = "asc") String sortDir) {
        ApiKeyPrincipal principal = requireScope(ApiKeyScope.STRUCTURE_READ);
        rateLimiter.consumeOrThrow("apikey:" + principal.getApiKeyId(), RateLimitOperation.INVENTORY_READ);

        if (principal.getWarehouseId() != null) {
            // Return only the bound warehouse
            WarehouseDto dto = warehouseService.getWarehouseById(principal.getWarehouseId(), request);
            return ResponseEntity.ok(ResponseTemplate.success(
                    WarehousePagedResponse.builder()
                            .content(java.util.List.of(dto))
                            .page(0).size(1).totalElements(1).totalPages(1).first(true).last(true)
                            .build()));
        }

        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        PageRequest pageable = PageRequest.of(page, Math.min(size, ConfigurationConstants.MAX_PAGE_SIZE), sort);
        return ResponseEntity.ok(ResponseTemplate.success(
                warehouseService.getAllWarehousesPaged(request, pageable, null, null, false)));
    }

    @Operation(summary = "Get warehouse by ID [STRUCTURE_READ]")
    @GetMapping("/warehouses/{id}")
    public ResponseEntity<ResponseTemplate<WarehouseDto>> getWarehouseById(
            @PathVariable Long id, HttpServletRequest request) {
        ApiKeyPrincipal principal = requireScope(ApiKeyScope.STRUCTURE_READ);
        rateLimiter.consumeOrThrow("apikey:" + principal.getApiKeyId(), RateLimitOperation.INVENTORY_READ);

        enforceWarehouseBinding(principal, id);
        return ResponseEntity.ok(ResponseTemplate.success(warehouseService.getWarehouseById(id, request)));
    }

    // ==================== STRUCTURE_READ: Racks ====================

    @Operation(summary = "List racks [STRUCTURE_READ]",
            description = "Returns paginated list of racks. If the API key is bound to a warehouse, only racks from that warehouse are returned.")
    @GetMapping("/racks")
    public ResponseEntity<ResponseTemplate<RackPagedResponse>> getRacks(
            HttpServletRequest request,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort by field") @RequestParam(defaultValue = "id") String sortBy,
            @Parameter(description = "Sort direction") @RequestParam(defaultValue = "asc") String sortDir) {
        ApiKeyPrincipal principal = requireScope(ApiKeyScope.STRUCTURE_READ);
        rateLimiter.consumeOrThrow("apikey:" + principal.getApiKeyId(), RateLimitOperation.INVENTORY_READ);

        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        PageRequest pageable = PageRequest.of(page, Math.min(size, ConfigurationConstants.MAX_PAGE_SIZE), sort);

        if (principal.getWarehouseId() != null) {
            return ResponseEntity.ok(ResponseTemplate.success(
                    rackService.getRacksByWarehousePaged(principal.getWarehouseId(), request, pageable)));
        }

        return ResponseEntity.ok(ResponseTemplate.success(
                rackService.getAllRacksPaged(request, pageable)));
    }

    @Operation(summary = "Get rack by ID [STRUCTURE_READ]")
    @GetMapping("/racks/{id}")
    public ResponseEntity<ResponseTemplate<RackDto>> getRackById(
            @PathVariable Long id, HttpServletRequest request) {
        ApiKeyPrincipal principal = requireScope(ApiKeyScope.STRUCTURE_READ);
        rateLimiter.consumeOrThrow("apikey:" + principal.getApiKeyId(), RateLimitOperation.INVENTORY_READ);
        return ResponseEntity.ok(ResponseTemplate.success(rackService.getRackById(id, request)));
    }

    @Operation(summary = "Get assortments in a rack [STRUCTURE_READ + INVENTORY_READ]",
            description = "Returns paginated assortments for a specific rack. Requires both STRUCTURE_READ and INVENTORY_READ scopes.")
    @GetMapping("/racks/{rackId}/assortments")
    public ResponseEntity<ResponseTemplate<PagedResponse<AssortmentWithItemDto>>> getRackAssortments(
            @PathVariable Long rackId,
            HttpServletRequest request,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort by field") @RequestParam(defaultValue = "id") String sortBy,
            @Parameter(description = "Sort direction") @RequestParam(defaultValue = "asc") String sortDir,
            @Parameter(description = "Search by item name or code") @RequestParam(required = false) String search) {
        requireScope(ApiKeyScope.STRUCTURE_READ);
        ApiKeyPrincipal principal = requireScope(ApiKeyScope.INVENTORY_READ);
        rateLimiter.consumeOrThrow("apikey:" + principal.getApiKeyId(), RateLimitOperation.INVENTORY_READ);

        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        PageRequest pageable = PageRequest.of(page, Math.min(size, ConfigurationConstants.MAX_PAGE_SIZE), sort);
        return ResponseEntity.ok(ResponseTemplate.success(
                PagedResponse.from(assortmentService.getAssortmentsByRackIdPaged(
                        rackId, request, pageable, search, null, null, null))));
    }

    // ==================== REPORTS_GENERATE ====================

    @Operation(summary = "Generate expiry report [REPORTS_GENERATE]",
            description = "Generates a report of products expiring within specified days. Supports PDF, EXCEL, CSV formats.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Report file"),
            @ApiResponse(responseCode = "403", description = "INSUFFICIENT_SCOPE or WAREHOUSE_ACCESS_DENIED")
    })
    @PostMapping("/reports/expiry")
    public ResponseEntity<?> generateExpiryReport(
            @Valid @RequestBody ExpiryReportRequest request,
            HttpServletRequest httpRequest) {
        ApiKeyPrincipal principal = requireScope(ApiKeyScope.REPORTS_GENERATE);
        rateLimiter.consumeOrThrow("apikey:" + principal.getApiKeyId(), RateLimitOperation.REPORT_GENERATE);

        Long warehouseId = resolveWarehouseId(principal, request.getWarehouseId());
        byte[] fileBytes = reportExportService.generateExpiryReport(
                warehouseId, request.getFormat(), request.getDaysAhead());
        return buildFileResponse(fileBytes, ReportType.EXPIRY, request.getFormat());
    }

    @Operation(summary = "Generate temperature alerts report [REPORTS_GENERATE]",
            description = "Generates a report of temperature alert violations. Supports date range filtering and PDF, EXCEL, CSV formats.")
    @PostMapping("/reports/temperature-alerts")
    public ResponseEntity<?> generateTemperatureAlertReport(
            @Valid @RequestBody TemperatureAlertReportRequest request,
            HttpServletRequest httpRequest) {
        ApiKeyPrincipal principal = requireScope(ApiKeyScope.REPORTS_GENERATE);
        rateLimiter.consumeOrThrow("apikey:" + principal.getApiKeyId(), RateLimitOperation.REPORT_GENERATE);

        Long warehouseId = resolveWarehouseId(principal, request.getWarehouseId());
        byte[] fileBytes = reportExportService.generateTemperatureAlertReport(
                warehouseId, request.getFormat(), request.getStartDate(), request.getEndDate());
        return buildFileResponse(fileBytes, ReportType.TEMPERATURE_ALERTS, request.getFormat());
    }

    @Operation(summary = "Generate inventory stock report [REPORTS_GENERATE]",
            description = "Generates a full inventory stock report. Supports PDF, EXCEL, CSV formats.")
    @PostMapping("/reports/inventory-stock")
    public ResponseEntity<?> generateInventoryStockReport(
            @Valid @RequestBody InventoryStockReportRequest request,
            HttpServletRequest httpRequest) {
        ApiKeyPrincipal principal = requireScope(ApiKeyScope.REPORTS_GENERATE);
        rateLimiter.consumeOrThrow("apikey:" + principal.getApiKeyId(), RateLimitOperation.REPORT_GENERATE);

        Long warehouseId = resolveWarehouseId(principal, request.getWarehouseId());
        byte[] fileBytes = reportExportService.generateInventoryStockReport(warehouseId, request.getFormat());
        return buildFileResponse(fileBytes, ReportType.INVENTORY_STOCK, request.getFormat());
    }

    // ==================== Helpers ====================

    private ApiKeyPrincipal requireScope(ApiKeyScope scope) {
        ApiKeyPrincipal principal = getApiKeyPrincipal();
        if (!principal.hasScope(scope)) {
            log.warn("API key '{}' lacks required scope: {}", principal.getApiKeyName(), scope);
            throw new IllegalArgumentException("INSUFFICIENT_SCOPE");
        }
        return principal;
    }

    private ApiKeyPrincipal getApiKeyPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof ApiKeyPrincipal)) {
            throw new IllegalArgumentException("API_KEY_REQUIRED");
        }
        return (ApiKeyPrincipal) auth.getPrincipal();
    }

    /**
     * For reports: if the API key is bound to a warehouse, force that warehouseId.
     * If the key is global, use the request's warehouseId (which may be null = all).
     */
    private Long resolveWarehouseId(ApiKeyPrincipal principal, Long requestedWarehouseId) {
        if (principal.getWarehouseId() != null) {
            if (requestedWarehouseId != null && !principal.getWarehouseId().equals(requestedWarehouseId)) {
                throw new IllegalArgumentException("WAREHOUSE_ACCESS_DENIED");
            }
            return principal.getWarehouseId();
        }
        return requestedWarehouseId;
    }

    /**
     * Validates that a warehouse-bound API key can access the specified warehouse.
     */
    private void enforceWarehouseBinding(ApiKeyPrincipal principal, Long warehouseId) {
        if (principal.getWarehouseId() != null && !principal.getWarehouseId().equals(warehouseId)) {
            throw new IllegalArgumentException("WAREHOUSE_ACCESS_DENIED");
        }
    }

    private ResponseEntity<byte[]> buildFileResponse(byte[] fileBytes, ReportType reportType, ReportFormat format) {
        String filename = reportExportService.buildFilename(reportType, format);
        String contentType = reportExportService.getContentType(format);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .contentLength(fileBytes.length)
                .body(fileBytes);
    }
}
