package com.github.dawid_stolarczyk.magazyn.Controller.Alerts;

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

    @Operation(summary = "Get all alerts with pagination",
            description = "Returns all system alerts ordered by creation date (newest first)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = PagedResponse.class)))
    })
    @GetMapping
    public ResponseEntity<ResponseTemplate<PagedResponse<AlertDto>>> getAllAlerts(
            HttpServletRequest request,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, Math.min(size, 100));
        return ResponseEntity.ok(ResponseTemplate.success(
                PagedResponse.from(alertService.getAllAlerts(request, pageable))));
    }

    @Operation(summary = "Get active (unresolved) alerts",
            description = "Returns only alerts with status OPEN or ACTIVE")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = PagedResponse.class)))
    })
    @GetMapping("/active")
    public ResponseEntity<ResponseTemplate<PagedResponse<AlertDto>>> getActiveAlerts(
            HttpServletRequest request,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, Math.min(size, 100));
        return ResponseEntity.ok(ResponseTemplate.success(
                PagedResponse.from(alertService.getActiveAlerts(request, pageable))));
    }

    @Operation(summary = "Get alerts by status")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = PagedResponse.class)))
    })
    @GetMapping("/status/{status}")
    public ResponseEntity<ResponseTemplate<PagedResponse<AlertDto>>> getAlertsByStatus(
            @PathVariable AlertStatus status,
            HttpServletRequest request,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, Math.min(size, 100));
        return ResponseEntity.ok(ResponseTemplate.success(
                PagedResponse.from(alertService.getAlertsByStatus(status, request, pageable))));
    }

    @Operation(summary = "Get alerts by type")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = PagedResponse.class)))
    })
    @GetMapping("/type/{alertType}")
    public ResponseEntity<ResponseTemplate<PagedResponse<AlertDto>>> getAlertsByType(
            @PathVariable AlertType alertType,
            HttpServletRequest request,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, Math.min(size, 100));
        return ResponseEntity.ok(ResponseTemplate.success(
                PagedResponse.from(alertService.getAlertsByType(alertType, request, pageable))));
    }

    @Operation(summary = "Get alerts for a specific warehouse")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = PagedResponse.class)))
    })
    @GetMapping("/warehouse/{warehouseId}")
    public ResponseEntity<ResponseTemplate<PagedResponse<AlertDto>>> getAlertsByWarehouse(
            @PathVariable Long warehouseId,
            HttpServletRequest request,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, Math.min(size, 100));
        return ResponseEntity.ok(ResponseTemplate.success(
                PagedResponse.from(alertService.getAlertsByWarehouse(warehouseId, request, pageable))));
    }

    @Operation(summary = "Get alerts for a specific rack")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = PagedResponse.class)))
    })
    @GetMapping("/rack/{rackId}")
    public ResponseEntity<ResponseTemplate<PagedResponse<AlertDto>>> getAlertsByRack(
            @PathVariable Long rackId,
            HttpServletRequest request,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, Math.min(size, 100));
        return ResponseEntity.ok(ResponseTemplate.success(
                PagedResponse.from(alertService.getAlertsByRack(rackId, request, pageable))));
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
            description = "Update the status of an alert (resolve, dismiss, etc.)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Alert updated successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AlertDto.class))),
            @ApiResponse(responseCode = "404", description = "Error codes: ALERT_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "403", description = "Access denied - requires ADMIN role",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PatchMapping("/{alertId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<AlertDto>> updateAlertStatus(
            @PathVariable Long alertId,
            @Valid @RequestBody AlertStatusUpdateRequest updateRequest,
            HttpServletRequest request) {
        try {
            return ResponseEntity.ok(ResponseTemplate.success(
                    alertService.updateAlertStatus(alertId, updateRequest, request)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ResponseTemplate.error(e.getMessage()));
        }
    }

    @Operation(summary = "Get alert statistics",
            description = "Returns counts of alerts by status")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AlertService.AlertStatistics.class)))
    })
    @GetMapping("/statistics")
    public ResponseEntity<ResponseTemplate<AlertService.AlertStatistics>> getStatistics(HttpServletRequest request) {
        return ResponseEntity.ok(ResponseTemplate.success(alertService.getStatistics(request)));
    }
}
