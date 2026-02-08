package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "Outbound operation audit record")
public class OutboundOperationDto {

    @Schema(description = "Operation ID", example = "1")
    private Long id;

    @Schema(description = "Item ID", example = "42")
    private Long itemId;

    @Schema(description = "Item name (denormalized)", example = "Laptop Dell XPS 15")
    private String itemName;

    @Schema(description = "Item code - GS1-128 barcode (denormalized)", example = "12345678901234")
    private String itemCode;

    @Schema(description = "Rack ID", example = "5")
    private Long rackId;

    @Schema(description = "Rack marker/location", example = "A-01-03")
    private String rackMarker;

    @Schema(description = "User ID who issued the item", example = "3")
    private Long issuedBy;

    @Schema(description = "Full name of user who issued the item", example = "Jan Kowalski")
    private String issuedByName;

    @Schema(description = "Operation timestamp (ISO 8601)", example = "2026-02-05T14:30:00Z")
    private String operationTimestamp;

    @Schema(description = "Position X on rack", example = "2")
    private Integer positionX;

    @Schema(description = "Position Y on rack", example = "3")
    private Integer positionY;

    @Schema(description = "Quantity issued", example = "1")
    private Integer quantity;

    @Schema(description = "Assortment code - GS1-128 barcode (denormalized, assortment is deleted)", example = "01123456789012341710260205")
    private String assortmentCode;

    @Schema(description = "Whether the pick was FIFO compliant", example = "true")
    private boolean fifoCompliant;
}
