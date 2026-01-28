package com.github.dawid_stolarczyk.magazyn.Repositories;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.WebAuthnCredential;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WebAuthRepository extends JpaRepository<WebAuthnCredential, Long> {

    Optional<WebAuthnCredential> findByCredentialIdAndUserHandle(
            String credentialId,
            String userHandle
    );

    Optional<WebAuthnCredential> findByCredentialId(String credentialId);

    List<WebAuthnCredential> findByUserHandle(String userHandle);

    Optional<WebAuthnCredential> findFirstByUserHandle(String userHandle);


    default void updateSignatureCount(String credentialId, long newCount) {
        findByCredentialId(credentialId).ifPresent(c -> {
            c.setSignatureCount(newCount);
            save(c);
        });
    }


}
