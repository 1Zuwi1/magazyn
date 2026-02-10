package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import com.github.dawid_stolarczyk.magazyn.Model.Enums.AlertStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for updating alert status (supports bulk updates)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to update alert status for one or multiple alerts")
public class AlertStatusUpdateRequest {

    @NotEmpty(message = "At least one alert ID is required")
    @Schema(description = "List of alert IDs to update", example = "[1, 2, 3]")
    private List<Long> alertIds;

    @NotNull(message = "New status is required")
    @Schema(description = "New status for the alert(s)", example = "RESOLVED")
    private AlertStatus status;

    @Size(max = 1000, message = "Resolution notes must be at most 1000 characters")
    @Schema(description = "Optional notes about the resolution", example = "Issue was caused by sensor malfunction, recalibrated")
    private String resolutionNotes;
}
