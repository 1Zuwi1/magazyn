package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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

    @Size(max = 100, message = "Passkey name must be at most 100 characters")
    @Schema(description = "Optional name for the passkey (max 100 chars). If empty or null, will auto-generate name like 'Passkey 1'",
            example = "My MacBook Pro",
            nullable = true)
    private String keyName;
}
