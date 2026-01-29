package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.Email;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Getter
@Setter
@NoArgsConstructor
public class TwoFactorAuthenticatorResponse {
    private String secretKey;
    @Email
    private String email;
    private String issuer;


    public TwoFactorAuthenticatorResponse(String secretKey, String email, String issuer) {
        this.secretKey = secretKey;
        this.email = email;
        this.issuer = issuer;
    }
}
