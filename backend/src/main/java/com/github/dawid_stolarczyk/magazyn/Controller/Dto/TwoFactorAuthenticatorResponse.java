package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
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

    public String getSecretKey() {
        return secretKey;
    }

    public void setSecretKey(String secretKey) {
        this.secretKey = secretKey;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getIssuer() {
        return issuer;
    }

    public void setIssuer(String issuer) {
        this.issuer = issuer;
    }
}
