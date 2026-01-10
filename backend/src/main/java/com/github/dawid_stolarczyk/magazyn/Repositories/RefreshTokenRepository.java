package com.github.dawid_stolarczyk.magazyn.Repositories;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByTokenAndRevokedFalseAndExpiresAtAfter(String token, Instant now);

    void deleteByRevokedTrueOrExpiresAtBefore(Instant now);

}
