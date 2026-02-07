package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import com.github.dawid_stolarczyk.magazyn.Model.Enums.AlertStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for updating alert status
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to update alert status")
public class AlertStatusUpdateRequest {

    @NotNull(message = "New status is required")
    @Schema(description = "New status for the alert", example = "RESOLVED")
    private AlertStatus status;

    @Size(max = 1000, message = "Resolution notes must be at most 1000 characters")
    @Schema(description = "Optional notes about the resolution", example = "Issue was caused by sensor malfunction, recalibrated")
    private String resolutionNotes;
}
