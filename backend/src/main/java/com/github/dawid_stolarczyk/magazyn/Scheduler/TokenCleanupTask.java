package com.github.dawid_stolarczyk.magazyn.Scheduler;

import com.github.dawid_stolarczyk.magazyn.Repositories.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Component
public class TokenCleanupTask {
    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional
    public void cleanUpExpiredTokens() {
        refreshTokenRepository.deleteByRevokedTrueOrExpiresAtBefore(Instant.now());
    }
}
