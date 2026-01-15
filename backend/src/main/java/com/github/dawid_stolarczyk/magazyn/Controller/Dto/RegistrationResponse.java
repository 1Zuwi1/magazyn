package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import com.yubico.webauthn.data.AuthenticatorAttestationResponse;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegistrationResponse {
    @NotBlank
    private String id;
    @NotBlank
    private String rawId;
    @NotBlank
    private AuthenticatorAttestationResponse response;
    @NotBlank
    private String type;
}
