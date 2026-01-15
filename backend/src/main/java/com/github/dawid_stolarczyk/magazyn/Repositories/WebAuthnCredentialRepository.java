package com.github.dawid_stolarczyk.magazyn.Repositories;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.WebAuthnCredential;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WebAuthnCredentialRepository extends JpaRepository<WebAuthnCredential, Long> {
    List<WebAuthnCredential> findAllByUserEmail(String email);
    Optional<WebAuthnCredential> findByUserEmail(String email);
    Optional<WebAuthnCredential> findByCredentialId(byte[] credentialId);
}
