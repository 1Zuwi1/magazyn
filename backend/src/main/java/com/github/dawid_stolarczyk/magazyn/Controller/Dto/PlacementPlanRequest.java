package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Getter
@Setter
@Schema(description = "Request for generating a placement plan")
public class PlacementPlanRequest {
    @NotNull
    @Schema(description = "ID of the item to place", example = "1")
    private Long itemId;

    @Min(1)
    @Max(10000)
    @Schema(description = "Quantity of items to place", example = "25", minimum = "1", maximum = "10000")
    private int quantity;

    @Schema(description = "Optional warehouse ID to limit search to specific warehouse", example = "1")
    private Long warehouseId;

    @Schema(description = """
            Whether to reserve the allocated positions for this user.
            
            When `true`:
            - Each allocated position (rack + x,y coordinate) is reserved for 5 minutes
            - Only the requesting user can confirm placement to these positions
            - Other users will NOT see these positions as available
            - Reservations automatically expire after 5 minutes if not confirmed
            - Response includes `reserved=true` and `reservedUntil` timestamp
            
            When `false` (default):
            - Positions are returned but NOT reserved
            - Other users may use the same positions
            - No time limit for confirmation
            - Response includes `reserved=false`
            """,
            example = "true",
            defaultValue = "false")
    private Boolean reserve = false;
}
