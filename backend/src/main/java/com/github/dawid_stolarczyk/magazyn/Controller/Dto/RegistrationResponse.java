package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RegistrationResponse {
    private String userId;  // Twój userId / email powiązany z kontem
    private String id;      // credentialId w Base64URL
    private String rawId;   // opcjonalnie rawId z WebAuthn API
    private String type;    // "public-key"
    private String clientDataJSON;      // Base64URL
    private String attestationObject;   // Base64URL
}
