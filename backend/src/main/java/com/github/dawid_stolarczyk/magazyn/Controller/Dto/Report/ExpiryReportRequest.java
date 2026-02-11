package com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report;

import com.github.dawid_stolarczyk.magazyn.Model.Enums.ReportFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to generate an expiry report")
public class ExpiryReportRequest {
    @NotNull(message = "Format is required")
    @Schema(description = "Output format", example = "CSV")
    private ReportFormat format;

    @Schema(description = "Filter by warehouse ID (null = all warehouses)")
    private Long warehouseId;

    @Builder.Default
    @Schema(description = "Days to look ahead for expiry", example = "7")
    private int daysAhead = 7;

    @Builder.Default
    @Schema(description = "Send as email attachment instead of download", example = "false")
    private boolean sendEmail = false;
}
