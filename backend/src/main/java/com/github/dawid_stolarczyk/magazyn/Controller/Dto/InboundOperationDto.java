package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO reprezentujący informacje o operacji przyjęcia towaru (audyt)
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "Inbound operation audit record")
public class InboundOperationDto {

    @Schema(description = "Operation ID", example = "1")
    private Long id;

    @Schema(description = "Item ID", example = "42")
    private Long itemId;

    @Schema(description = "Item name", example = "Laptop Dell XPS 15")
    private String itemName;

    @Schema(description = "Item code - GS1-128 barcode", example = "0112345678901234")
    private String itemCode;

    @Schema(description = "Rack ID", example = "5")
    private Long rackId;

    @Schema(description = "Rack marker/location", example = "A-01-03")
    private String rackMarker;

    @Schema(description = "User ID who received the item", example = "3")
    private Long receivedBy;

    @Schema(description = "Full name of user who received the item", example = "Jan Kowalski")
    private String receivedByName;

    @Schema(description = "Operation timestamp (ISO 8601)", example = "2026-02-05T14:30:00Z")
    private String operationTimestamp;

    @Schema(description = "Position X on rack", example = "2")
    private Integer positionX;

    @Schema(description = "Position Y on rack", example = "3")
    private Integer positionY;

    @Schema(description = "Quantity received", example = "1")
    private Integer quantity;

    @Schema(description = "Assortment ID created during this operation", example = "123")
    private Long assortmentId;

    @Schema(description = "GS1-128 barcode code of created assortment", example = "01123456789012341710260205")
    private String assortmentCode;
}
