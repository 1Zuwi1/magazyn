package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Position in rack to pick/check (code)")
public class OutboundPickPosition {

    @NotNull
    @Schema(description = "Code of assortment", example = "11260206011234567891234521940130")
    private String code;
}
