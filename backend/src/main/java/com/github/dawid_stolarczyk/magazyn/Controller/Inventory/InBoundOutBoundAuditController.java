package com.github.dawid_stolarczyk.magazyn.Controller.Inventory;

import com.github.dawid_stolarczyk.magazyn.Common.ConfigurationConstants;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.InboundOperationDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.OutboundOperationDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.PagedResponse;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ResponseTemplate;
import com.github.dawid_stolarczyk.magazyn.Services.Inventory.InboundAuditService;
import com.github.dawid_stolarczyk.magazyn.Services.Inventory.OutboundAuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.sql.Timestamp;
import java.time.Instant;

@RestController
@RequestMapping("/audit")
@Tag(name = "Operations Audit", description = "Endpoints for auditing inbound/outbound operations")
@AllArgsConstructor
public class InBoundOutBoundAuditController {
    private final InboundAuditService inboundAuditService;
    private final OutboundAuditService outboundAuditService;

    @Operation(summary = "Get inbound operations with filters and pagination (ADMIN only)",
            description = "Returns paginated list of inbound operations. All filters are optional and can be combined. " +
                    "Results are sorted by the specified field and direction.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ResponseTemplate.PagedInboundOperationsResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid parameters (e.g., invalid date format)",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "403", description = "Access denied - requires ADMIN role",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @GetMapping("/inbound-operations")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<PagedResponse<InboundOperationDto>>> getInboundOperations(
            HttpServletRequest request,
            @Parameter(description = "Filter by user ID (who received the goods)")
            @RequestParam(required = false) Long userId,
            @Parameter(description = "Filter by item ID")
            @RequestParam(required = false) Long itemId,
            @Parameter(description = "Filter by rack ID")
            @RequestParam(required = false) Long rackId,
            @Parameter(description = "Filter by start date (ISO 8601 format)", example = "2026-02-01T00:00:00Z")
            @RequestParam(required = false) String startDate,
            @Parameter(description = "Filter by end date (ISO 8601 format)", example = "2026-02-05T23:59:59Z")
            @RequestParam(required = false) String endDate,
            @Parameter(description = "Page number (0-indexed)", example = "0")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size (max 100)", example = "20")
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort by field", example = "operationTimestamp")
            @RequestParam(defaultValue = "operationTimestamp") String sortBy,
            @Parameter(description = "Sort direction (asc/desc)", example = "desc")
            @RequestParam(defaultValue = "desc") String sortDir) {

        // Parse dates if provided
        Timestamp start = startDate != null ? Timestamp.from(Instant.parse(startDate)) : null;
        Timestamp end = endDate != null ? Timestamp.from(Instant.parse(endDate)) : null;

        // Create pageable with sorting and size limit
        Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageRequest = PageRequest.of(page, Math.min(size, ConfigurationConstants.MAX_PAGE_SIZE), Sort.by(direction, sortBy));

        // Get filtered and paginated results
        PagedResponse<InboundOperationDto> response = inboundAuditService.getOperations(
                userId, itemId, rackId, start, end, request, pageRequest);

        return ResponseEntity.ok(ResponseTemplate.success(response));
    }

    @Operation(summary = "Get outbound operations with filters and pagination (ADMIN only)",
            description = "Returns paginated list of outbound operations. All filters are optional and can be combined. " +
                    "Results are sorted by the specified field and direction.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ResponseTemplate.PagedOutboundOperationsResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid parameters (e.g., invalid date format)",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "403", description = "Access denied - requires ADMIN role",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @GetMapping("/outbound-operations")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<PagedResponse<OutboundOperationDto>>> getOutBoundOperations(
            HttpServletRequest request,
            @Parameter(description = "Filter by user ID (who issued the goods)")
            @RequestParam(required = false) Long userId,
            @Parameter(description = "Filter by item ID")
            @RequestParam(required = false) Long itemId,
            @Parameter(description = "Filter by rack ID")
            @RequestParam(required = false) Long rackId,
            @Parameter(description = "Filter by start date (ISO 8601 format)", example = "2026-02-01T00:00:00Z")
            @RequestParam(required = false) String startDate,
            @Parameter(description = "Filter by end date (ISO 8601 format)", example = "2026-02-05T23:59:59Z")
            @RequestParam(required = false) String endDate,
            @Parameter(description = "Page number (0-indexed)", example = "0")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size (max 100)", example = "20")
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort by field", example = "operationTimestamp")
            @RequestParam(defaultValue = "operationTimestamp") String sortBy,
            @Parameter(description = "Sort direction (asc/desc)", example = "desc")
            @RequestParam(defaultValue = "desc") String sortDir) {

        // Parse dates if provided
        Timestamp start = startDate != null ? Timestamp.from(Instant.parse(startDate)) : null;
        Timestamp end = endDate != null ? Timestamp.from(Instant.parse(endDate)) : null;

        // Create pageable with sorting and size limit
        Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageRequest = PageRequest.of(page, Math.min(size, ConfigurationConstants.MAX_PAGE_SIZE), Sort.by(direction, sortBy));

        // Get filtered and paginated results
        PagedResponse<OutboundOperationDto> response = outboundAuditService.getOperations(
                userId, itemId, rackId, start, end, request, pageRequest);

        return ResponseEntity.ok(ResponseTemplate.success(response));
    }
}
