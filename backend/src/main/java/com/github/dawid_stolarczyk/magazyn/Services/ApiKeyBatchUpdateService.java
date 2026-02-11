package com.github.dawid_stolarczyk.magazyn.Services;

import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.ApiKeyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ApiKeyBatchUpdateService {

    private final ApiKeyRepository apiKeyRepository;

    @Transactional
    public void batchUpdateLastUsedAt(Map<Long, Instant> updates) {
        if (updates == null || updates.isEmpty()) {
            return;
        }

        try {
            updates.forEach(apiKeyRepository::updateLastUsedAt);
            log.debug("Updated last used timestamp for {} API keys", updates.size());
        } catch (Exception e) {
            log.error("Failed to batch update API key last used timestamps", e);
            throw e;
        }
    }
}
