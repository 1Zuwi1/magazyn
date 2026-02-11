package com.github.dawid_stolarczyk.magazyn.Services;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ApiKeyCreatedResponse;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.CreateApiKeyRequest;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.ApiKey;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Warehouse;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.ApiKeyScope;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.ApiKeyRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.UserRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.WarehouseRepository;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ApiKeyServiceTest {

    @Mock
    private ApiKeyRepository apiKeyRepository;
    @Mock
    private WarehouseRepository warehouseRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private EmailService emailService;
    @Mock
    private Bucket4jRateLimiter rateLimiter;
    @Mock
    private HttpServletRequest request;

    @InjectMocks
    private ApiKeyService apiKeyService;

    @Test
    @DisplayName("should_CreateApiKey_When_ValidRequest")
    void should_CreateApiKey_When_ValidRequest() {
        // Given
        CreateApiKeyRequest req = new CreateApiKeyRequest();
        req.setName("Test Key");
        req.setScopes(Set.of(ApiKeyScope.INVENTORY_READ));
        req.setWarehouseId(1L);

        Warehouse warehouse = new Warehouse();
        warehouse.setId(1L);
        warehouse.setName("Main Warehouse");

        when(warehouseRepository.findById(1L)).thenReturn(Optional.of(warehouse));
        when(apiKeyRepository.existsByName("Test Key")).thenReturn(false);
        when(apiKeyRepository.save(any(ApiKey.class))).thenAnswer(i -> {
            ApiKey key = i.getArgument(0);
            key.setId(500L);
            key.setCreatedAt(Instant.now());
            return key;
        });

        // When
        ApiKeyCreatedResponse response = apiKeyService.createApiKey(req, 10L, request);

        // Then
        assertThat(response.getId()).isEqualTo(500L);
        assertThat(response.getRawKey()).isNotBlank();
        assertThat(response.getKeyPrefix()).hasSize(8);
        verify(apiKeyRepository).save(any(ApiKey.class));
    }
}
