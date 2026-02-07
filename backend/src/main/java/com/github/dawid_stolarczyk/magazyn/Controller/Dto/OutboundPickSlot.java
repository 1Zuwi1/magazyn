package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "A single pick slot in FIFO order")
public class OutboundPickSlot {

    @Schema(description = "Assortment ID", example = "101")
    private Long assortmentId;

    @Schema(description = "Assortment code - GS1-128 barcode", example = "01123456789012341710260205")
    private String assortmentCode;

    @Schema(description = "Rack ID", example = "5")
    private Long rackId;

    @Schema(description = "Rack marker/location", example = "A-01-03")
    private String rackMarker;

    @Schema(description = "Position X on rack", example = "2")
    private Integer positionX;

    @Schema(description = "Position Y on rack", example = "3")
    private Integer positionY;

    @Schema(description = "Assortment creation date (ISO 8601)", example = "2026-01-15T10:30:00Z")
    private String createdAt;

    @Schema(description = "Assortment expiry date (ISO 8601)", example = "2026-06-15T10:30:00Z")
    private String expiresAt;
}
