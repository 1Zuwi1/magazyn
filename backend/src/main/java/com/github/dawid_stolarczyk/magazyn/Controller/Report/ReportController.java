package com.github.dawid_stolarczyk.magazyn.Controller.Report;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report.ExpiryReportRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report.InventoryStockReportRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report.TemperatureAlertReportRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ResponseTemplate;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.ReportFormat;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.ReportType;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.UserRepository;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.AuthUtil;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.RateLimitOperation;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.RateLimiter;
import com.github.dawid_stolarczyk.magazyn.Services.Report.ReportExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/reports")
@Tag(name = "Reports", description = "Endpoints for generating and exporting warehouse reports")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class ReportController {

    private final ReportExportService reportExportService;
    private final RateLimiter rateLimiter;
    private final UserRepository userRepository;


    @Operation(summary = "Generate expiry report [ADMIN]",
            description = "Generates a report of products expiring within the specified number of days")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Report generated successfully",
                    content = @Content(mediaType = "application/octet-stream")),
            @ApiResponse(responseCode = "400", description = "Error codes: WAREHOUSE_NOT_FOUND, REPORT_GENERATION_FAILED",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping("/expiry")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> generateExpiryReport(
            @Valid @RequestBody ExpiryReportRequest request,
            HttpServletRequest httpRequest) {
        rateLimiter.consumeOrThrow(httpRequest.getRemoteAddr(), RateLimitOperation.REPORT_GENERATE);

        byte[] fileBytes = reportExportService.generateExpiryReport(
                request.getWarehouseId(), request.getFormat(), request.getDaysAhead());

        if (request.isSendEmail()) {
            String email = resolveCurrentUserEmail();
            reportExportService.sendReportByEmail(email, fileBytes, ReportType.EXPIRY, request.getFormat());
            return ResponseEntity.ok(ResponseTemplate.success());
        }

        return buildFileResponse(fileBytes, ReportType.EXPIRY, request.getFormat());
    }

    @Operation(summary = "Generate temperature alerts report [ADMIN]",
            description = "Generates a report of temperature alert violations, optionally filtered by date range")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Report generated successfully",
                    content = @Content(mediaType = "application/octet-stream")),
            @ApiResponse(responseCode = "400", description = "Error codes: WAREHOUSE_NOT_FOUND, INVALID_DATE_RANGE, REPORT_GENERATION_FAILED",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping("/temperature-alerts")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> generateTemperatureAlertReport(
            @Valid @RequestBody TemperatureAlertReportRequest request,
            HttpServletRequest httpRequest) {
        rateLimiter.consumeOrThrow(httpRequest.getRemoteAddr(), RateLimitOperation.REPORT_GENERATE);

        byte[] fileBytes = reportExportService.generateTemperatureAlertReport(
                request.getWarehouseId(), request.getFormat(), request.getStartDate(), request.getEndDate());

        if (request.isSendEmail()) {
            String email = resolveCurrentUserEmail();
            reportExportService.sendReportByEmail(email, fileBytes, ReportType.TEMPERATURE_ALERTS, request.getFormat());
            return ResponseEntity.ok(ResponseTemplate.success());
        }

        return buildFileResponse(fileBytes, ReportType.TEMPERATURE_ALERTS, request.getFormat());
    }

    @Operation(summary = "Generate inventory stock report [ADMIN]",
            description = "Generates a full inventory stock report for a warehouse or all warehouses")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Report generated successfully",
                    content = @Content(mediaType = "application/octet-stream")),
            @ApiResponse(responseCode = "400", description = "Error codes: WAREHOUSE_NOT_FOUND, REPORT_GENERATION_FAILED",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping("/inventory-stock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> generateInventoryStockReport(
            @Valid @RequestBody InventoryStockReportRequest request,
            HttpServletRequest httpRequest) {
        rateLimiter.consumeOrThrow(httpRequest.getRemoteAddr(), RateLimitOperation.REPORT_GENERATE);

        byte[] fileBytes = reportExportService.generateInventoryStockReport(
                request.getWarehouseId(), request.getFormat());

        if (request.isSendEmail()) {
            String email = resolveCurrentUserEmail();
            reportExportService.sendReportByEmail(email, fileBytes, ReportType.INVENTORY_STOCK, request.getFormat());
            return ResponseEntity.ok(ResponseTemplate.success());
        }

        return buildFileResponse(fileBytes, ReportType.INVENTORY_STOCK, request.getFormat());
    }

    private String resolveCurrentUserEmail() {
        Long userId = AuthUtil.getCurrentUserId();
        User user = userRepository.findById(userId).orElseThrow();
        return user.getEmail();
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
