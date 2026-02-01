package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WebAuthnFinishRequest {
    @NotBlank
    @Schema(description = "The JSON credential from the browser's WebAuthn API", example = "{\"id\":\"...\",\"rawId\":\"...\",\"type\":\"public-key\",\"response\":{...}}")
    private String credentialJson;

    @Schema(description = "Optional name for the passkey", example = "My MacBook Pro")
    private String keyName;
}
