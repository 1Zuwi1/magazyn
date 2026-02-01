package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class TwoFactorMethodsResponse {
    @Schema(description = "List of available 2FA methods")
    private List<String> methods;

    @Schema(description = "The current default 2FA method", example = "EMAIL")
    private com.github.dawid_stolarczyk.magazyn.Model.Enums.Default2faMethod defaultMethod;
}
