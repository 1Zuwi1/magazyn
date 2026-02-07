package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for submitting a rack report from sensors/measurements
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to submit a rack status report")
public class RackReportRequest {

    @NotNull(message = "Rack ID is required")
    @Schema(description = "ID of the rack being reported", example = "1")
    private Long rackId;

    @NotNull(message = "Current weight is required")
    @Positive(message = "Current weight must be positive")
    @Max(value = 50000, message = "Current weight cannot exceed 50000 kg")
    @Schema(description = "Current measured weight on the rack in kg", example = "150.5")
    private Float currentWeight;

    @NotNull(message = "Current temperature is required")
    @Min(value = -273, message = "Temperature cannot be below absolute zero (-273°C)")
    @Max(value = 200, message = "Temperature cannot exceed 200°C")
    @Schema(description = "Current measured temperature in °C", example = "4.2")
    private Float currentTemperature;

    @Schema(description = "Optional sensor/source identifier", example = "SENSOR-RACK-001")
    private String sensorId;
}
