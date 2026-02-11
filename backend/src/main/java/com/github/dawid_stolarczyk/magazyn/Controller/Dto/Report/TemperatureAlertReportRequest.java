package com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report;

import com.github.dawid_stolarczyk.magazyn.Model.Enums.ReportFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to generate a temperature alerts report")
public class TemperatureAlertReportRequest {
    @NotNull(message = "Format is required")
    @Schema(description = "Output format", example = "EXCEL")
    private ReportFormat format;

    @Schema(description = "Filter by warehouse ID (null = all warehouses)")
    private Long warehouseId;

    @Schema(description = "Start date filter (ISO 8601)")
    private Instant startDate;

    @Schema(description = "End date filter (ISO 8601)")
    private Instant endDate;

    @Builder.Default
    @Schema(description = "Send as email attachment instead of download", example = "false")
    private boolean sendEmail = false;
}