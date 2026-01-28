package com.github.dawid_stolarczyk.magazyn.Security.Config;

import com.yubico.webauthn.RelyingParty;
import com.yubico.webauthn.CredentialRepository;
import com.yubico.webauthn.data.RelyingPartyIdentity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Set;

@Configuration
public class WebAuthnConfig {

    private final CredentialRepository credentialRepository;

    @Value("${app.domain}")
    private String appDomain;
    @Value("${app.name}")
    private String appName;

    public WebAuthnConfig(CredentialRepository credentialRepository) {
        this.credentialRepository = credentialRepository;
    }

    @Bean
    public RelyingParty relyingParty() {
        return RelyingParty.builder()
                .identity(
                        RelyingPartyIdentity.builder()
                                .id(appDomain)       // np. domena backendu
                                .name(appName)          // dowolna nazwa RP
                                .build()
                )
                .credentialRepository(credentialRepository)
                .origins(Set.of(
                        "https://twoja-domena.pl",      // frontend origin
                        "http://localhost:3000"         // lokalny dev
                ))
                .allowUntrustedAttestation(true)        // dev/test, produkcja: false
                .build();
    }
}
