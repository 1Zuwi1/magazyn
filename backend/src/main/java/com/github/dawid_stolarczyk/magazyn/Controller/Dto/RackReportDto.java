package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO for rack report information
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Rack status report from sensors")
public class RackReportDto {

    @Schema(description = "Report ID", example = "1")
    private Long id;

    @Schema(description = "Rack ID", example = "5")
    private Long rackId;

    @Schema(description = "Rack marker/identifier", example = "R-01")
    private String rackMarker;

    @Schema(description = "Warehouse ID", example = "1")
    private Long warehouseId;

    @Schema(description = "Warehouse name", example = "Magazyn Centralny")
    private String warehouseName;

    @Schema(description = "Measured weight in kg", example = "150.5")
    private Float currentWeight;

    @Schema(description = "Measured temperature in °C", example = "4.2")
    private Float currentTemperature;

    @Schema(description = "Sensor/source identifier", example = "SENSOR-RACK-001")
    private String sensorId;

    @Schema(description = "Whether this report triggered any alerts", example = "true")
    private boolean alertTriggered;

    @Schema(description = "When the report was created")
    private Instant createdAt;
}
