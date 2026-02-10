package com.github.dawid_stolarczyk.magazyn.Controller.Alerts;

import com.github.dawid_stolarczyk.magazyn.Common.ConfigurationConstants;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.AlertDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.AlertStatusUpdateRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.PagedResponse;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ResponseTemplate;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AlertStatus;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AlertType;
import com.github.dawid_stolarczyk.magazyn.Services.Alerts.AlertService;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for managing system alerts about rack anomalies.
 * Alerts are automatically generated when rack reports detect threshold violations.
 */
@RestController
@RequestMapping("/alerts")
@Tag(name = "Alerts", description = "Endpoints for managing system alerts about rack anomalies")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

    @Operation(summary = "Get alerts with optional filtering",
            description = """
                    Returns system alerts with pagination. Supports filtering by:
                    - `status` - filter by alert status (accepts array: OPEN, RESOLVED, DISMISSED). If empty/null - all statuses.
                    - `type` - filter by alert type (accepts array: WEIGHT_EXCEEDED, TEMPERATURE_TOO_HIGH, etc.). If empty/null - all types.
                    - `warehouseId` - filter by warehouse
                    - `rackId` - filter by specific rack
                    - `activeOnly=true` - only unresolved alerts (OPEN status)
                    
                    All filters are optional and can be combined.
                    Results ordered by creation date (newest first).
                    
                    Response includes `summary` field with alert statistics (counts by status).
                    """)
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success with statistics in summary field",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseTemplate.PagedAlertsResponse.class)))
    })
    @GetMapping
    public ResponseEntity<ResponseTemplate<PagedResponse<AlertDto>>> getAlerts(
            HttpServletRequest request,
            @Parameter(description = "Filter by alert status (array, optional)") @RequestParam(required = false) java.util.List<AlertStatus> status,
            @Parameter(description = "Filter by alert type (array, optional)") @RequestParam(required = false) java.util.List<AlertType> type,
            @Parameter(description = "Filter by warehouse ID") @RequestParam(required = false) Long warehouseId,
            @Parameter(description = "Filter by rack ID") @RequestParam(required = false) Long rackId,
            @Parameter(description = "Only active/unresolved alerts") @RequestParam(required = false, defaultValue = "false") boolean activeOnly,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {

        PageRequest pageable = PageRequest.of(page, Math.min(size, ConfigurationConstants.MAX_PAGE_SIZE));

        PagedResponse<AlertDto> response;
        if (rackId != null) {
            response = PagedResponse.from(alertService.getAlertsByRack(rackId, request, pageable));
        } else if (warehouseId != null) {
            response = PagedResponse.from(alertService.getAlertsByWarehouse(warehouseId, request, pageable));
        } else if (type != null && !type.isEmpty()) {
            response = PagedResponse.from(alertService.getAlertsByTypes(type, request, pageable));
        } else if (status != null && !status.isEmpty()) {
            response = PagedResponse.from(alertService.getAlertsByStatuses(status, request, pageable));
        } else if (activeOnly) {
            response = PagedResponse.from(alertService.getActiveAlerts(request, pageable));
        } else {
            response = PagedResponse.from(alertService.getAllAlerts(request, pageable));
        }

        // Add statistics summary
        PagedResponse<AlertDto> responseWithSummary = PagedResponse.<AlertDto>builder()
                .content(response.getContent())
                .page(response.getPage())
                .size(response.getSize())
                .totalElements(response.getTotalElements())
                .totalPages(response.getTotalPages())
                .first(response.isFirst())
                .last(response.isLast())
                .summary(alertService.getStatistics(request))
                .build();

        return ResponseEntity.ok(ResponseTemplate.success(responseWithSummary));
    }

    @Operation(summary = "Get single alert by ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AlertDto.class))),
            @ApiResponse(responseCode = "404", description = "Error codes: ALERT_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @GetMapping("/{alertId}")
    public ResponseEntity<ResponseTemplate<AlertDto>> getAlertById(
            @PathVariable Long alertId,
            HttpServletRequest request) {
        try {
            return ResponseEntity.ok(ResponseTemplate.success(alertService.getAlertById(alertId, request)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ResponseTemplate.error(e.getMessage()));
        }
    }

    @Operation(summary = "Update alert status (ADMIN only)",
            description = """
                    Update the status of one or multiple alerts (resolve, dismiss, etc.).
                    Supports bulk updates by providing array of alert IDs.
                    Returns list of updated alerts.
                    """)
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Alerts updated successfully - returns list of updated alerts",
                    content = @Content(mediaType = "application/json")),
            @ApiResponse(responseCode = "404", description = "Error codes: ALERT_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "403", description = "Access denied - requires ADMIN role",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PatchMapping("/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<java.util.List<AlertDto>>> updateAlertStatus(
            @Valid @RequestBody AlertStatusUpdateRequest updateRequest,
            HttpServletRequest request) {
        try {
            java.util.List<AlertDto> updatedAlerts = new java.util.ArrayList<>();
            for (Long alertId : updateRequest.getAlertIds()) {
                try {
                    updatedAlerts.add(alertService.updateAlertStatus(alertId, updateRequest, request));
                } catch (IllegalArgumentException e) {
                    // Skip alerts that don't exist
                }
            }
            if (updatedAlerts.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ResponseTemplate.error("ALERT_NOT_FOUND"));
            }
            return ResponseEntity.ok(ResponseTemplate.success(updatedAlerts));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ResponseTemplate.error(e.getMessage()));
        }
    }
}
