package com.github.dawid_stolarczyk.magazyn.Controller.Alerts;

import com.github.dawid_stolarczyk.magazyn.Common.ConfigurationConstants;
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

    @Operation(summary = "Get rack reports with optional filtering",
            description = """
                    Returns rack reports with pagination. Supports filtering by:
                    - `rackId` - filter by specific rack
                    - `warehouseId` - filter by warehouse
                    - `withAlerts=true` - only reports that triggered alerts

                    All filters are optional and can be combined.
                    Results ordered by creation date (newest first).
                    """)
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseTemplate.PagedRackReportsResponse.class)))
    })
    @GetMapping
    public ResponseEntity<ResponseTemplate<PagedResponse<RackReportDto>>> getReports(
            HttpServletRequest request,
            @Parameter(description = "Filter by specific rack ID") @RequestParam(required = false) Long rackId,
            @Parameter(description = "Filter by warehouse ID") @RequestParam(required = false) Long warehouseId,
            @Parameter(description = "Only reports that triggered alerts") @RequestParam(required = false, defaultValue = "false") boolean withAlerts,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {

        PageRequest pageable = PageRequest.of(page, Math.min(size, ConfigurationConstants.MAX_PAGE_SIZE));

        if (rackId != null) {
            return ResponseEntity.ok(ResponseTemplate.success(
                    PagedResponse.from(rackReportService.getReportsByRackPaged(rackId, request, pageable))));
        }

        if (warehouseId != null) {
            return ResponseEntity.ok(ResponseTemplate.success(
                    PagedResponse.from(rackReportService.getReportsByWarehousePaged(warehouseId, request, pageable))));
        }

        if (withAlerts) {
            return ResponseEntity.ok(ResponseTemplate.success(
                    PagedResponse.from(rackReportService.getReportsWithAlerts(request, pageable))));
        }

        return ResponseEntity.ok(ResponseTemplate.success(
                PagedResponse.from(rackReportService.getAllReportsPaged(request, pageable))));
    }
}
