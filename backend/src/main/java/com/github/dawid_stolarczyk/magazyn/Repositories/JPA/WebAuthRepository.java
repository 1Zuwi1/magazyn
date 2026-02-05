package com.github.dawid_stolarczyk.magazyn.Repositories.JPA;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.WebAuthnCredential;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WebAuthRepository extends JpaRepository<WebAuthnCredential, Long> {

    Optional<WebAuthnCredential> findByCredentialIdAndUserHandle(
            String credentialId,
            String userHandle
    );

    Optional<WebAuthnCredential> findByCredentialId(String credentialId);

    List<WebAuthnCredential> findByUserHandle(String userHandle);

    List<WebAuthnCredential> findByUserId(Long userId);

    Optional<WebAuthnCredential> findFirstByUserHandle(String userHandle);

    Optional<WebAuthnCredential> findFirstByEmail(String email);

    long countByUserHandle(String userHandle);

    // Check if passkey name exists for user (case-insensitive)
    boolean existsByUserHandleAndNameIgnoreCase(String userHandle, String name);

    // Check if passkey name exists for user, excluding specific passkey ID (case-insensitive)
    boolean existsByUserHandleAndNameIgnoreCaseAndIdNot(String userHandle, String name, Long id);

    boolean existsByUserId(Long userId);

    @Modifying
    @Query("UPDATE WebAuthnCredential c SET c.signatureCount = :newCount WHERE c.credentialId = :credentialId")
    void updateSignatureCount(@Param("credentialId") String credentialId, @Param("newCount") long newCount);


}
