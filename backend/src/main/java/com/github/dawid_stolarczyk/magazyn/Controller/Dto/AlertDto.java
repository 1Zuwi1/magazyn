package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import com.github.dawid_stolarczyk.magazyn.Model.Enums.AlertStatus;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AlertType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO for alert information
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Alert/notification about a rack anomaly")
public class AlertDto {

    @Schema(description = "Alert ID", example = "1")
    private Long id;

    @Schema(description = "Rack ID that triggered the alert", example = "5")
    private Long rackId;

    @Schema(description = "Rack marker/identifier", example = "R-01")
    private String rackMarker;

    @Schema(description = "Warehouse ID where the rack is located", example = "1")
    private Long warehouseId;

    @Schema(description = "Warehouse name", example = "Magazyn Centralny")
    private String warehouseName;

    @Schema(description = "Type of the alert", example = "WEIGHT_EXCEEDED")
    private AlertType alertType;

    @Schema(description = "Human-readable description of the alert type")
    private String alertTypeDescription;

    @Schema(description = "Current status of the alert", example = "OPEN")
    private AlertStatus status;

    @Schema(description = "Detailed message about the alert")
    private String message;

    @Schema(description = "The threshold value that was exceeded")
    private Float thresholdValue;

    @Schema(description = "The actual measured value that caused the alert")
    private Float actualValue;

    @Schema(description = "When the alert was created")
    private Instant createdAt;

    @Schema(description = "When the alert was last updated")
    private Instant updatedAt;

    @Schema(description = "When the alert was resolved (if applicable)")
    private Instant resolvedAt;

    @Schema(description = "Name of user who resolved the alert")
    private String resolvedByName;

    @Schema(description = "Resolution notes")
    private String resolutionNotes;
}
