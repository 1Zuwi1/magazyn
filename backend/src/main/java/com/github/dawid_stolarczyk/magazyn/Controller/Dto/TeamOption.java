package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@Schema(description = "Team option")
public class TeamOption {
    @Schema(description = "Team enum value", example = "OPERATIONS")
    private String value;

    @Schema(description = "Team display name", example = "Operacje magazynowe")
    private String label;
}
