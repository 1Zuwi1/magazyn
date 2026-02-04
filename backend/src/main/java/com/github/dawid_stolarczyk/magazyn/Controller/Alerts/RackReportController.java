package com.github.dawid_stolarczyk.magazyn.Controller.Alerts;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.*;
import com.github.dawid_stolarczyk.magazyn.Services.Alerts.RackReportService;
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
import org.springframework.web.bind.annotation.*;

/**
 * Controller for managing rack status reports from sensors/measurements.
 * Reports are processed to detect anomalies and generate alerts.
 */
@RestController
@RequestMapping("/rack-reports")
@Tag(name = "Rack Reports", description = "Endpoints for submitting and viewing rack status reports from sensors")
@RequiredArgsConstructor
public class RackReportController {

    private final RackReportService rackReportService;

    @Operation(summary = "Submit a rack status report",
            description = """
                    Submits a new rack status report from sensors/measurements.
                    The system will automatically:
                    1. Validate the rack exists
                    2. Check for anomalies (weight, temperature)
                    3. Create alerts if thresholds are exceeded
                    4. Distribute notifications to users
                    
                    **Deduplication:** If an active alert of the same type already exists for the rack,
                    no new alert will be created to avoid spam.
                    """)
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Report processed successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = RackReportResponse.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: RACK_NOT_FOUND, VALIDATION_ERROR",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping
    public ResponseEntity<ResponseTemplate<RackReportResponse>> submitReport(
            @Valid @RequestBody RackReportRequest request,
            HttpServletRequest httpRequest) {
        RackReportResponse response = rackReportService.processReport(request, httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(ResponseTemplate.success(response));
    }

    @Operation(summary = "Get all rack reports with pagination",
            description = "Returns all rack reports ordered by creation date (newest first)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = PagedResponse.class)))
    })
    @GetMapping
    public ResponseEntity<ResponseTemplate<PagedResponse<RackReportDto>>> getAllReports(
            HttpServletRequest request,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, Math.min(size, 100));
        return ResponseEntity.ok(ResponseTemplate.success(
                PagedResponse.from(rackReportService.getAllReportsPaged(request, pageable))));
    }

    @Operation(summary = "Get reports for a specific rack",
            description = "Returns all reports for a specific rack with pagination")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = PagedResponse.class)))
    })
    @GetMapping("/rack/{rackId}")
    public ResponseEntity<ResponseTemplate<PagedResponse<RackReportDto>>> getReportsByRack(
            @PathVariable Long rackId,
            HttpServletRequest request,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, Math.min(size, 100));
        return ResponseEntity.ok(ResponseTemplate.success(
                PagedResponse.from(rackReportService.getReportsByRackPaged(rackId, request, pageable))));
    }

    @Operation(summary = "Get reports for a specific warehouse",
            description = "Returns all reports for racks in a specific warehouse")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = PagedResponse.class)))
    })
    @GetMapping("/warehouse/{warehouseId}")
    public ResponseEntity<ResponseTemplate<PagedResponse<RackReportDto>>> getReportsByWarehouse(
            @PathVariable Long warehouseId,
            HttpServletRequest request,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, Math.min(size, 100));
        return ResponseEntity.ok(ResponseTemplate.success(
                PagedResponse.from(rackReportService.getReportsByWarehousePaged(warehouseId, request, pageable))));
    }

    @Operation(summary = "Get reports that triggered alerts",
            description = "Returns only reports that triggered at least one alert")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = PagedResponse.class)))
    })
    @GetMapping("/with-alerts")
    public ResponseEntity<ResponseTemplate<PagedResponse<RackReportDto>>> getReportsWithAlerts(
            HttpServletRequest request,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, Math.min(size, 100));
        return ResponseEntity.ok(ResponseTemplate.success(
                PagedResponse.from(rackReportService.getReportsWithAlerts(request, pageable))));
    }
}
