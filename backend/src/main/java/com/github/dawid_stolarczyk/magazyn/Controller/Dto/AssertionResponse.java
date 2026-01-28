package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Getter
@Setter
public class AssertionResponse {
    private String userId;            // email lub UUID
    private String id;                // credentialId
    private String rawId;             // opcjonalnie rawId
    private String type;              // "public-key"
    private String clientDataJSON;    // Base64URL
    private String authenticatorData; // Base64URL
    private String signature;         // Base64URL
    private String userHandle;        // Base64URL
}
