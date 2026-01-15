package com.github.dawid_stolarczyk.magazyn.Security.Config;

import com.github.dawid_stolarczyk.magazyn.Security.Auth.Passkey.JpaWebAuthnCredentialRepository;
import com.yubico.webauthn.RelyingParty;
import com.yubico.webauthn.data.RelyingPartyIdentity;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Set;

@Configuration
public class WebAuthnConfig {

    @Bean
    public RelyingParty relyingParty(JpaWebAuthnCredentialRepository credentialRepository) {
        return RelyingParty.builder()
                .identity(RelyingPartyIdentity.builder()
                        .id("twoja.domena.pl")
                        .name("Twoja Aplikacja")
                        .build())
                .credentialRepository(credentialRepository)
                .origins(Set.of("https://twoja.domena.pl"))
                .build();
    }
}
