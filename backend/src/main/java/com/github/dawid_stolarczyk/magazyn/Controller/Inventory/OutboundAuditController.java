package com.github.dawid_stolarczyk.magazyn.Controller.Inventory;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.OutboundOperationDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.PagedResponse;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ResponseTemplate;
import com.github.dawid_stolarczyk.magazyn.Services.Inventory.OutboundAuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/audit/outbound-operations")
@Tag(name = "Outbound Operations Audit", description = "Endpoints for auditing outbound operations (product issuing)")
@RequiredArgsConstructor
public class OutboundAuditController {

    private final OutboundAuditService outboundAuditService;

    @Operation(summary = "Get all outbound operations with pagination (ADMIN only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseTemplate.PagedOutboundOperationsResponse.class))),
            @ApiResponse(responseCode = "403", description = "Access denied - requires ADMIN role",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<PagedResponse<OutboundOperationDto>>> getAllOperations(
            HttpServletRequest request,
            @Parameter(description = "Page number (0-indexed)", example = "0")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size", example = "20")
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort by field", example = "operationTimestamp")
            @RequestParam(defaultValue = "operationTimestamp") String sortBy,
            @Parameter(description = "Sort direction (asc/desc)", example = "desc")
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        PagedResponse<OutboundOperationDto> response = outboundAuditService.getAllOperations(request, pageRequest);
        return ResponseEntity.ok(ResponseTemplate.success(response));
    }

    @Operation(summary = "Get outbound operations by user ID (ADMIN only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseTemplate.PagedOutboundOperationsResponse.class))),
            @ApiResponse(responseCode = "403", description = "Access denied - requires ADMIN role",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @GetMapping("/by-user/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<PagedResponse<OutboundOperationDto>>> getOperationsByUser(
            @PathVariable Long userId,
            HttpServletRequest request,
            @Parameter(description = "Page number (0-indexed)", example = "0")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size", example = "20")
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort by field", example = "operationTimestamp")
            @RequestParam(defaultValue = "operationTimestamp") String sortBy,
            @Parameter(description = "Sort direction (asc/desc)", example = "desc")
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        PagedResponse<OutboundOperationDto> response = outboundAuditService.getOperationsByUser(userId, request, pageRequest);
        return ResponseEntity.ok(ResponseTemplate.success(response));
    }

    @Operation(summary = "Get outbound operations by item ID (ADMIN only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success",
                    content = @Content(mediaType = "application/json",
                            array = @ArraySchema(schema = @Schema(implementation = OutboundOperationDto.class)))),
            @ApiResponse(responseCode = "403", description = "Access denied - requires ADMIN role",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @GetMapping("/by-item/{itemId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<List<OutboundOperationDto>>> getOperationsByItem(
            @PathVariable Long itemId,
            HttpServletRequest request) {
        List<OutboundOperationDto> response = outboundAuditService.getOperationsByItem(itemId, request);
        return ResponseEntity.ok(ResponseTemplate.success(response));
    }

    @Operation(summary = "Get outbound operations by rack ID (ADMIN only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success",
                    content = @Content(mediaType = "application/json",
                            array = @ArraySchema(schema = @Schema(implementation = OutboundOperationDto.class)))),
            @ApiResponse(responseCode = "403", description = "Access denied - requires ADMIN role",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @GetMapping("/by-rack/{rackId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<List<OutboundOperationDto>>> getOperationsByRack(
            @PathVariable Long rackId,
            HttpServletRequest request) {
        List<OutboundOperationDto> response = outboundAuditService.getOperationsByRack(rackId, request);
        return ResponseEntity.ok(ResponseTemplate.success(response));
    }

    @Operation(summary = "Get outbound operations by date range (ADMIN only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success",
                    content = @Content(mediaType = "application/json",
                            array = @ArraySchema(schema = @Schema(implementation = OutboundOperationDto.class)))),
            @ApiResponse(responseCode = "400", description = "Invalid date format",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "403", description = "Access denied - requires ADMIN role",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @GetMapping("/by-date-range")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<List<OutboundOperationDto>>> getOperationsByDateRange(
            @Parameter(description = "Start date (ISO 8601)", example = "2026-02-01T00:00:00Z")
            @RequestParam String startDate,
            @Parameter(description = "End date (ISO 8601)", example = "2026-02-05T23:59:59Z")
            @RequestParam String endDate,
            HttpServletRequest request) {

        Timestamp start = Timestamp.from(Instant.parse(startDate));
        Timestamp end = Timestamp.from(Instant.parse(endDate));
        List<OutboundOperationDto> response = outboundAuditService.getOperationsByDateRange(start, end, request);
        return ResponseEntity.ok(ResponseTemplate.success(response));
    }

    @Operation(summary = "Get outbound operations by user and date range (ADMIN only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success",
                    content = @Content(mediaType = "application/json",
                            array = @ArraySchema(schema = @Schema(implementation = OutboundOperationDto.class)))),
            @ApiResponse(responseCode = "400", description = "Invalid date format",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "403", description = "Access denied - requires ADMIN role",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @GetMapping("/by-user/{userId}/date-range")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<List<OutboundOperationDto>>> getOperationsByUserAndDateRange(
            @PathVariable Long userId,
            @Parameter(description = "Start date (ISO 8601)", example = "2026-02-01T00:00:00Z")
            @RequestParam String startDate,
            @Parameter(description = "End date (ISO 8601)", example = "2026-02-05T23:59:59Z")
            @RequestParam String endDate,
            HttpServletRequest request) {

        Timestamp start = Timestamp.from(Instant.parse(startDate));
        Timestamp end = Timestamp.from(Instant.parse(endDate));
        List<OutboundOperationDto> response = outboundAuditService.getOperationsByUserAndDateRange(userId, start, end, request);
        return ResponseEntity.ok(ResponseTemplate.success(response));
    }
}
