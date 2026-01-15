package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Getter
@Setter
public class TwoFactorAuthenticatorResponse {
    private String secretKey;
    private String email;
    private String issuer;

    public TwoFactorAuthenticatorResponse() {
    }

    public TwoFactorAuthenticatorResponse(String secretKey, String email, String issuer) {
        this.secretKey = secretKey;
        this.email = email;
        this.issuer = issuer;
    }
}
