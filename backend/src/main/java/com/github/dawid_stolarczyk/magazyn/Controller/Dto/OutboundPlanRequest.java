package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request for outbound operation planning")
public class OutboundPlanRequest {

    @NotNull
    @Schema(description = "Item ID to pick", example = "42")
    private Long itemId;

    @NotNull
    @Min(1)
    @Schema(description = "Quantity to pick", example = "5")
    private Integer quantity;
}
