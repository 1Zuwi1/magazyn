package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Getter
@Setter
@Schema(description = "Response containing the generated placement plan")
public class PlacementPlanResponse {
    @Schema(description = "ID of the item", example = "1")
    private Long itemId;

    @Schema(description = "Requested quantity of items", example = "25")
    private int requestedQuantity;

    @Schema(description = "Number of positions successfully allocated", example = "25")
    private int allocatedQuantity;

    @Schema(description = "Remaining quantity that could not be allocated", example = "0")
    private int remainingQuantity;

    @Schema(description = "List of allocated placement positions")
    private List<PlacementSlotResponse> placements;

    @Schema(description = "Whether positions were reserved for the user", example = "true")
    private Boolean reserved;

    @Schema(description = "Reservation expiry time (only present when reserved=true)",
            example = "2026-02-02T19:15:00Z")
    private Instant reservedUntil;

    @Schema(description = "Number of positions reserved (may differ from allocatedQuantity if some positions were already reserved by others)")
    private Integer reservedCount;
}
