package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

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
@Schema(description = "Request to check FIFO compliance for a specific position in a rack")
public class OutboundCheckRequest {

    @NotNull
    @Schema(description = "Rack ID", example = "5")
    private Long rackId;

    @NotNull
    @Schema(description = "X position (column)", example = "3")
    private Integer positionX;

    @NotNull
    @Schema(description = "Y position (row)", example = "7")
    private Integer positionY;
}
