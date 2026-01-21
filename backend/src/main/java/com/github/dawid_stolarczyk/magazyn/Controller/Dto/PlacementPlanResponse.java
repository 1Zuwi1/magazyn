package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Getter
@Setter
public class PlacementPlanResponse {
    private Long itemId;
    private int requestedQuantity;
    private int allocatedQuantity;
    private int remainingQuantity;
    private List<PlacementSlotResponse> placements;
}
