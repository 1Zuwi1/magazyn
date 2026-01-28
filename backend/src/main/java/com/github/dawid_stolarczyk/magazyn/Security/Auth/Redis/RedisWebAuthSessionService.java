package com.github.dawid_stolarczyk.magazyn.Security.Auth.Redis;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yubico.webauthn.AssertionRequest;
import com.yubico.webauthn.data.PublicKeyCredentialCreationOptions;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.Duration;

@Service
public class RedisWebAuthSessionService {

    private static final String REG_PREFIX = "webauthn:reg:";
    private static final String ASSERT_PREFIX = "webauthn:assert:";
    private static final Duration TTL = Duration.ofMinutes(5);

    private final RedisTemplate<String, String> redisTemplate;

    public RedisWebAuthSessionService(
            RedisTemplate<String, String> redisTemplate
    ) {
        this.redisTemplate = redisTemplate;
    }

    /* ================= REGISTRATION ================= */

    public void saveRegistrationRequest(
            String userHandle,
            PublicKeyCredentialCreationOptions request
    ) {
        try {
            String json = request.toJson();
            redisTemplate.opsForValue()
                    .set(REG_PREFIX + userHandle, json, TTL);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to save registration request", e);
        }
    }

    public PublicKeyCredentialCreationOptions getRegistrationRequest(
            String userHandle
    ) {
        String json = redisTemplate.opsForValue()
                .get(REG_PREFIX + userHandle);

        if (json == null) {
            throw new IllegalStateException("Registration request not found or expired");
        }

        try {
            return PublicKeyCredentialCreationOptions.fromJson(json);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to parse registration request", e);
        }
    }

    /* ================= ASSERTION ================= */

    public void saveAssertionRequest(
            String userHandle,
            AssertionRequest request
    ) {
        try {
            String json = request.toJson();
            redisTemplate.opsForValue()
                    .set(ASSERT_PREFIX + userHandle, json, TTL);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to save assertion request", e);
        }
    }

    public AssertionRequest getAssertionRequest(
            String userHandle
    ) {
        String json = redisTemplate.opsForValue()
                .get(ASSERT_PREFIX + userHandle);

        if (json == null) {
            throw new IllegalStateException("Assertion request not found or expired");
        }

        try {
            return AssertionRequest.fromJson(json);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to parse assertion request", e);
        }
    }

    /* ================= COMMON ================= */

    public void delete(String userHandle) {
        redisTemplate.delete(REG_PREFIX + userHandle);
        redisTemplate.delete(ASSERT_PREFIX + userHandle);
    }
}