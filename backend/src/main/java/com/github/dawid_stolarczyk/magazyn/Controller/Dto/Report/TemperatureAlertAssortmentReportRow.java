package com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Single row in the temperature alerts report")
public class TemperatureAlertAssortmentReportRow {

    @Schema(description = "Rack marker", example = "A-01")
    private String rackMarker;

    @Schema(description = "Warehouse name", example = "Magazyn Główny")
    private String warehouseName;

    @Schema(description = "Assortment name", example = "Mleko 1L")
    private String itemName;

    @Schema(description = "Recorded temperature in °C", example = "25.5")
    private float recordedTemperature;

    @Schema(description = "Allowed minimum temperature in °C", example = "2.0")
    private float allowedMin;

    @Schema(description = "Allowed maximum temperature in °C", example = "8.0")
    private float allowedMax;

    @Schema(description = "Type of violation", example = "TEMPERATURE_TOO_HIGH")
    private String violationType;

    @Schema(description = "Timestamp of the violation")
    private Instant violationTimestamp;

    @Schema(description = "Sensor identifier", example = "SENSOR-RACK-001")
    private String sensorId;
}

