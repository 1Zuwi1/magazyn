package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SetDefault2faMethodRequest {
    @NotBlank
    @Schema(description = "The 2FA method to set as default", example = "AUTHENTICATOR")
    private String method;
}
