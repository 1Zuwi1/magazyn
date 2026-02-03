package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SetDefault2faMethodRequest {
    @NotNull
    @Schema(description = "The 2FA method to set as default", example = "AUTHENTICATOR")
    private com.github.dawid_stolarczyk.magazyn.Model.Enums.Default2faMethod method;
}
