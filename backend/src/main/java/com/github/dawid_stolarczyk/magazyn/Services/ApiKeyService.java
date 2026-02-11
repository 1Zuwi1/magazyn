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
import com.github.dawid_stolarczyk.magazyn.Utils.Hasher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.HashSet;
import java.util.List;

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

    @Transactional(rollbackFor = Exception.class)
    public ApiKeyCreatedResponse createApiKey(CreateApiKeyRequest request, Long createdByUserId) {
        if (apiKeyRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("API_KEY_NAME_ALREADY_EXISTS");
        }

        Warehouse warehouse = null;
        if (request.getWarehouseId() != null) {
            warehouse = warehouseRepository.findById(request.getWarehouseId())
                    .orElseThrow(() -> new IllegalArgumentException(AuthError.RESOURCE_NOT_FOUND.name()));
        }

        // Generate secure random key
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

        // Notify admins about new API key creation
        notifyAdminsAboutNewApiKey(apiKey);

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

    @Transactional
    public void revokeApiKey(Long apiKeyId) {
        ApiKey apiKey = apiKeyRepository.findById(apiKeyId)
                .orElseThrow(() -> new IllegalArgumentException(AuthError.RESOURCE_NOT_FOUND.name()));

        apiKey.setActive(false);
        apiKeyRepository.save(apiKey);
        log.info("API key revoked: id={}, name={}", apiKey.getId(), apiKey.getName());
    }

    @Transactional(readOnly = true)
    public List<ApiKeyResponse> listApiKeys() {
        return apiKeyRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ApiKeyResponse getApiKey(Long apiKeyId) {
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

        for (User admin : admins) {
            emailService.sendApiKeyCreatedEmail(
                    admin.getEmail(),
                    apiKey.getName(),
                    warehouseName,
                    apiKey.getCreatedAt().toString()
            );
        }

        log.info("Sent API key creation notification to {} admin(s)", admins.size());
    }
}
