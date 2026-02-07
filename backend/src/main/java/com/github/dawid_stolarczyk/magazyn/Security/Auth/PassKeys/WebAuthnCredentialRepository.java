package com.github.dawid_stolarczyk.magazyn.Security.Auth.PassKeys;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.WebAuthnCredential;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.WebAuthRepository;
import com.yubico.webauthn.CredentialRepository;
import com.yubico.webauthn.RegisteredCredential;
import com.yubico.webauthn.data.ByteArray;
import com.yubico.webauthn.data.PublicKeyCredentialDescriptor;
import com.yubico.webauthn.data.PublicKeyCredentialType;
import com.yubico.webauthn.data.exception.Base64UrlException;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class WebAuthnCredentialRepository implements CredentialRepository {

    private final WebAuthRepository repository;

    public WebAuthnCredentialRepository(WebAuthRepository repository) {
        this.repository = repository;
    }

    // Used when username IS KNOWN
    @Override
    public Set<PublicKeyCredentialDescriptor> getCredentialIdsForUsername(String username) {
        return repository.findFirstByEmail(username)
                .map(WebAuthnCredential::getUserHandle)
                .map(repository::findByUserHandle)
                .orElseGet(Collections::emptyList)
                .stream()
                .map(c -> {
                    try {
                        return PublicKeyCredentialDescriptor.builder()
                                .id(ByteArray.fromBase64Url(c.getCredentialId()))
                                .type(PublicKeyCredentialType.PUBLIC_KEY)
                                .build();
                    } catch (Base64UrlException e) {
                        throw new IllegalStateException(e);
                    }
                })
                .collect(Collectors.toSet());
    }

    @Override
    public Optional<ByteArray> getUserHandleForUsername(String username) {
        return repository
                .findFirstByEmail(username)
                .map(c -> {
                    try {
                        return ByteArray.fromBase64Url(c.getUserHandle());
                    } catch (Base64UrlException e) {
                        throw new RuntimeException(e);
                    }
                });
    }

    // userHandle → username
    @Override
    public Optional<String> getUsernameForUserHandle(ByteArray userHandle) {
        return repository
                .findFirstByUserHandle(userHandle.getBase64Url())
                .map(WebAuthnCredential::getEmail);
    }


    // Used during assertion verification
    @Override
    public Optional<RegisteredCredential> lookup(
            ByteArray credentialId,
            ByteArray userHandle
    ) {
        return repository
                .findByCredentialIdAndUserHandle(
                        credentialId.getBase64Url(),
                        userHandle.getBase64Url()
                )
                .map(c -> {
                    try {
                        return RegisteredCredential.builder()
                                .credentialId(credentialId)
                                .userHandle(userHandle)
                                .publicKeyCose(ByteArray.fromBase64Url(c.getPublicKeyCose()))
                                .signatureCount(c.getSignatureCount())
                                .build();
                    } catch (Base64UrlException e) {
                        throw new IllegalStateException(e);
                    }
                });
    }

    // Used for discoverable credentials / passkeys (username-less)
    @Override
    public Set<RegisteredCredential> lookupAll(ByteArray userHandle) {
        return repository.findByUserHandle(userHandle.getBase64Url())
                .stream()
                .map(c -> {
                    try {
                        return RegisteredCredential.builder()
                                .credentialId(ByteArray.fromBase64Url(c.getCredentialId()))
                                .userHandle(userHandle)
                                .publicKeyCose(ByteArray.fromBase64Url(c.getPublicKeyCose()))
                                .signatureCount(c.getSignatureCount())
                                .build();
                    } catch (Base64UrlException e) {
                        throw new IllegalStateException(e);
                    }
                })
                .collect(Collectors.toSet());
    }
}
