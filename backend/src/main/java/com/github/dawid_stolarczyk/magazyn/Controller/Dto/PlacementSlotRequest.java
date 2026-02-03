package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Getter
@Setter
public class PlacementSlotRequest {
    @NotNull
    private Long rackId;

    // Primitive int with @Min(1) ensures value >= 1 (default 0 would fail validation)
    @Min(1)
    private int positionX;

    // Primitive int with @Min(1) ensures value >= 1 (default 0 would fail validation)
    @Min(1)
    private int positionY;
}
