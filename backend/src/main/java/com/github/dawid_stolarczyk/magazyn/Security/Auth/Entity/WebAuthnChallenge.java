package com.github.dawid_stolarczyk.magazyn.Security.Auth.Entity;

import com.yubico.webauthn.data.PublicKeyCredentialCreationOptions;
import com.yubico.webauthn.data.PublicKeyCredentialRequestOptions;
import jakarta.persistence.Id;
import lombok.*;
import org.springframework.data.redis.core.RedisHash;

@RedisHash(value = "webauthnChallenge")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class WebAuthnChallenge {

    @Id
    private String userIdKey;
    private PublicKeyCredentialCreationOptions registrationOptions;
    private PublicKeyCredentialRequestOptions assertionOptions;
    private long userId;
}
