package com.github.dawid_stolarczyk.magazyn.Services;

import com.github.dawid_stolarczyk.magazyn.Exception.EncryptionException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SecretsServiceTest {

    @Test
    @DisplayName("should_LoadSecret_When_ValidConfig")
    void should_LoadSecret_When_ValidConfig() {
        // Given
        SecretsService secretsService = new SecretsService();
        ReflectionTestUtils.setField(secretsService, "secretPlaintext",
                "a-very-long-secret-key-at-least-32-bytes-long");
        ReflectionTestUtils.setField(secretsService, "secretPlaintextMinLength", 32);

        // When
        String secret = secretsService.loadSecret();

        // Then
        assertThat(secret).isEqualTo("a-very-long-secret-key-at-least-32-bytes-long");
    }

    @Test
    @DisplayName("should_ThrowException_When_SecretTooShort")
    void should_ThrowException_When_SecretTooShort() {
        // Given
        SecretsService secretsService = new SecretsService();
        ReflectionTestUtils.setField(secretsService, "secretPlaintext", "too-short");
        ReflectionTestUtils.setField(secretsService, "secretPlaintextMinLength", 32);

        // When & Then
        assertThatThrownBy(secretsService::loadSecret)
                .isInstanceOf(EncryptionException.class)
                .hasMessageContaining("too short");
    }
}
