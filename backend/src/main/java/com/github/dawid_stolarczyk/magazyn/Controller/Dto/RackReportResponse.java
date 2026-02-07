package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * DTO for rack report response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Response after submitting a rack report")
public class RackReportResponse {

    @Schema(description = "ID of the created report")
    private Long reportId;

    @Schema(description = "ID of the rack")
    private Long rackId;

    @Schema(description = "Rack marker/identifier")
    private String rackMarker;

    @Schema(description = "Reported weight in kg")
    private Float currentWeight;

    @Schema(description = "Reported temperature in °C")
    private Float currentTemperature;

    @Schema(description = "Whether any alerts were triggered")
    private boolean alertTriggered;

    @Schema(description = "List of alert types that were triggered (if any)")
    private List<String> triggeredAlertTypes;

    @Schema(description = "When the report was created")
    private Instant createdAt;
}
