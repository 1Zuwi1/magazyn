package com.github.dawid_stolarczyk.magazyn.Security.Auth.Passkey;

import com.github.dawid_stolarczyk.magazyn.Repositories.WebAuthnCredentialRepository;
import com.yubico.webauthn.CredentialRepository;
import com.yubico.webauthn.RegisteredCredential;
import com.yubico.webauthn.data.*;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class JpaWebAuthnCredentialRepository implements CredentialRepository {

    private final WebAuthnCredentialRepository repo;

    public JpaWebAuthnCredentialRepository(WebAuthnCredentialRepository repo) {
        this.repo = repo;
    }

    @Override
    public Set<PublicKeyCredentialDescriptor> getCredentialIdsForUsername(String username) {
        return repo.findAllByUserEmail(username).stream()
                .map(c -> PublicKeyCredentialDescriptor.builder()
                        .id(new ByteArray(c.getCredentialId()))
                        .build())
                .collect(Collectors.toSet());
    }

    @Override
    public Optional<ByteArray> getUserHandleForUsername(String username) {
        return repo.findByUserEmail(username)
                .map(c -> new ByteArray(c.getUser().getIdAsBytes())); // metoda w User, np. long -> byte[]
    }

    @Override
    public Optional<String> getUsernameForUserHandle(ByteArray byteArray) {
        return Optional.empty();
    }

    @Override
    public Optional<RegisteredCredential> lookup(ByteArray credentialId, ByteArray userHandle) {
        return repo.findByCredentialId(credentialId.getBytes())
                .map(c -> RegisteredCredential.builder()
                        .credentialId(new ByteArray(c.getCredentialId()))
                        .userHandle(new ByteArray(c.getUser().getIdAsBytes()))
                        .publicKeyCose(new ByteArray(c.getPublicKey()))
                        .signatureCount(c.getSignatureCount())
                        .build());
    }

    @Override
    public Set<RegisteredCredential> lookupAll(ByteArray byteArray) {
        return Set.of();
    }
}
