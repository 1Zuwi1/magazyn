package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Getter
@Setter
public class PlacementConfirmationRequest {
    @NotNull
    private Long itemId;
    @NotEmpty
    @Size(max = 1000)
    @Valid
    private List<PlacementSlotRequest> placements;
}
