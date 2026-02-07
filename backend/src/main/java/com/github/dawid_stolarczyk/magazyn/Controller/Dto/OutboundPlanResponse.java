package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Outbound operation plan response with FIFO-ordered pick list")
public class OutboundPlanResponse {

    @Schema(description = "Item ID", example = "42")
    private Long itemId;

    @Schema(description = "Item name", example = "Laptop Dell XPS 15")
    private String itemName;

    @Schema(description = "Requested quantity", example = "5")
    private Integer requestedQuantity;

    @Schema(description = "Total available quantity in stock (non-expired)", example = "12")
    private Long availableQuantity;

    @Schema(description = "Number of expired assortments for this item", example = "3")
    private Long expiredQuantity;

    @Schema(description = "Warning message if no valid assortments available", example = "All 3 assortments have expired")
    private String warning;

    @Schema(description = "Pick slots in FIFO order (oldest first, non-expired only)")
    private List<OutboundPickSlot> pickSlots;
}
