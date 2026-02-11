package com.github.dawid_stolarczyk.magazyn.Services;

import com.github.dawid_stolarczyk.magazyn.Common.Enums.AuthError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ApiKeyCreatedResponse;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ApiKeyResponse;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.CreateApiKeyRequest;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.ApiKey;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Warehouse;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AccountStatus;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.UserRole;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.ApiKeyRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.UserRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.WarehouseRepository;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.RateLimitOperation;
import com.github.dawid_stolarczyk.magazyn.Utils.Hasher;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.text.SimpleDateFormat;
import java.util.Base64;
import java.util.Date;
import java.util.HashSet;
import java.util.List;

import static com.github.dawid_stolarczyk.magazyn.Utils.InternetUtils.getClientIp;

@Service
@RequiredArgsConstructor
@Slf4j
public class ApiKeyService {

    private static final int KEY_BYTE_LENGTH = 32;
    private static final int PREFIX_LENGTH = 8;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final ApiKeyRepository apiKeyRepository;
    private final WarehouseRepository warehouseRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final Bucket4jRateLimiter rateLimiter;

    /**
     * Creates a new API key with the specified scopes and optional warehouse binding.
     *
     * @param request         API key configuration (name, scopes, optional warehouse)
     * @param createdByUserId ID of the user creating the key
     * @param httpRequest     HTTP request for rate limiting
     * @return response with generated API key (raw key only returned once)
     * @throws IllegalArgumentException if key name already exists or warehouse not found
     */
    @Transactional(rollbackFor = Exception.class)
    public ApiKeyCreatedResponse createApiKey(CreateApiKeyRequest request, Long createdByUserId, HttpServletRequest httpRequest) {
        rateLimiter.consumeOrThrow(getClientIp(httpRequest), RateLimitOperation.USER_ACTION_STRICT);
        if (apiKeyRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("API_KEY_NAME_ALREADY_EXISTS");
        }

        Warehouse warehouse = null;
        if (request.getWarehouseId() != null) {
            warehouse = warehouseRepository.findById(request.getWarehouseId())
                    .orElseThrow(() -> new IllegalArgumentException(AuthError.RESOURCE_NOT_FOUND.name()));
        }

        byte[] keyBytes = new byte[KEY_BYTE_LENGTH];
        SECURE_RANDOM.nextBytes(keyBytes);
        String rawKey = Base64.getUrlEncoder().withoutPadding().encodeToString(keyBytes);

        String keyHash = Hasher.hashSHA256(rawKey);
        String keyPrefix = rawKey.substring(0, PREFIX_LENGTH);

        ApiKey apiKey = ApiKey.builder()
                .keyHash(keyHash)
                .keyPrefix(keyPrefix)
                .name(request.getName())
                .warehouse(warehouse)
                .isActive(true)
                .scopes(new HashSet<>(request.getScopes()))
                .createdByUserId(createdByUserId)
                .build();

        apiKey = apiKeyRepository.save(apiKey);
        log.info("API key created: id={}, name={}, warehouseId={}, scopes={}, createdBy={}",
                apiKey.getId(), apiKey.getName(), apiKey.getWarehouseId(), apiKey.getScopes(), createdByUserId);

        return ApiKeyCreatedResponse.builder()
                .id(apiKey.getId())
                .rawKey(rawKey)
                .keyPrefix(keyPrefix)
                .name(apiKey.getName())
                .warehouseId(apiKey.getWarehouseId())
                .warehouseName(warehouse != null ? warehouse.getName() : null)
                .scopes(apiKey.getScopes())
                .createdAt(apiKey.getCreatedAt())
                .build();
    }

    /**
     * Sends email notifications to all admins about a new API key creation.
     *
     * @param apiKeyId ID of the newly created API key
     */
    public void sendApiKeyCreationNotification(Long apiKeyId) {
        ApiKey apiKey = apiKeyRepository.findById(apiKeyId)
                .orElseThrow(() -> new IllegalArgumentException(AuthError.RESOURCE_NOT_FOUND.name()));
        notifyAdminsAboutNewApiKey(apiKey);
    }

    /**
     * Revokes (deactivates) an API key.
     *
     * @param apiKeyId    ID of the API key to revoke
     * @param httpRequest HTTP request for rate limiting
     * @throws IllegalArgumentException if key not found
     */
    @Transactional
    public void revokeApiKey(Long apiKeyId, HttpServletRequest httpRequest) {
        rateLimiter.consumeOrThrow(getClientIp(httpRequest), RateLimitOperation.USER_ACTION_STRICT);
        ApiKey apiKey = apiKeyRepository.findById(apiKeyId)
                .orElseThrow(() -> new IllegalArgumentException(AuthError.RESOURCE_NOT_FOUND.name()));

        apiKey.setActive(false);
        apiKeyRepository.save(apiKey);
        log.info("API key revoked: id={}, name={}", apiKey.getId(), apiKey.getName());
    }

    /**
     * Lists all API keys (active and revoked).
     *
     * @param httpRequest HTTP request for rate limiting
     * @return list of API key DTOs (without raw keys)
     */
    @Transactional(readOnly = true)
    public List<ApiKeyResponse> listApiKeys(HttpServletRequest httpRequest) {
        rateLimiter.consumeOrThrow(getClientIp(httpRequest), RateLimitOperation.INVENTORY_READ);
        return apiKeyRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Retrieves details of a specific API key.
     *
     * @param apiKeyId    ID of the API key
     * @param httpRequest HTTP request for rate limiting
     * @return API key DTO (without raw key)
     * @throws IllegalArgumentException if key not found
     */
    @Transactional(readOnly = true)
    public ApiKeyResponse getApiKey(Long apiKeyId, HttpServletRequest httpRequest) {
        rateLimiter.consumeOrThrow(getClientIp(httpRequest), RateLimitOperation.INVENTORY_READ);
        ApiKey apiKey = apiKeyRepository.findById(apiKeyId)
                .orElseThrow(() -> new IllegalArgumentException(AuthError.RESOURCE_NOT_FOUND.name()));
        return toResponse(apiKey);
    }

    private ApiKeyResponse toResponse(ApiKey apiKey) {
        Warehouse warehouse = apiKey.getWarehouse();
        return ApiKeyResponse.builder()
                .id(apiKey.getId())
                .keyPrefix(apiKey.getKeyPrefix())
                .name(apiKey.getName())
                .warehouseId(apiKey.getWarehouseId())
                .warehouseName(warehouse != null ? warehouse.getName() : null)
                .isActive(apiKey.isActive())
                .scopes(apiKey.getScopes())
                .createdAt(apiKey.getCreatedAt())
                .lastUsedAt(apiKey.getLastUsedAt())
                .createdByUserId(apiKey.getCreatedByUserId())
                .build();
    }

    private void notifyAdminsAboutNewApiKey(ApiKey apiKey) {
        List<User> admins = userRepository.findByRoleAndStatus(UserRole.ADMIN, AccountStatus.ACTIVE);
        String warehouseName = apiKey.getWarehouse() != null ? apiKey.getWarehouse().getName() : "Globalny (wszystkie magazyny)";

        SimpleDateFormat simpleDateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        String createdAtFormatted = simpleDateFormat.format(new Date(apiKey.getCreatedAt().toEpochMilli()));
        for (User admin : admins) {
            emailService.sendApiKeyCreatedEmail(
                    admin.getEmail(),
                    apiKey.getName(),
                    warehouseName,
                    createdAtFormatted
            );
        }

        log.info("Sent API key creation notification to {} admin(s)", admins.size());
    }
}
