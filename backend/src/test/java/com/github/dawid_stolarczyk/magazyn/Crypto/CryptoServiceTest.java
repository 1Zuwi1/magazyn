package com.github.dawid_stolarczyk.magazyn.Crypto;

import com.github.dawid_stolarczyk.magazyn.Crypto.EncryptedData;
import com.github.dawid_stolarczyk.magazyn.Exception.EncryptionException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CryptoServiceTest {

    @Mock
    private CryptoKeyProvider keyProvider;

    @InjectMocks
    private CryptoService cryptoService;

    private SecretKey activeKek;
    private String kekName = "test-kek";

    @BeforeEach
    void setUp() throws Exception {
        activeKek = KeyGenerator.getInstance("AES").generateKey();
        when(keyProvider.getActiveKey()).thenReturn(activeKek);
        when(keyProvider.getActiveKeyName()).thenReturn(kekName);
    }

    @Test
    @DisplayName("should_EncryptAndDecryptData_Successfully")
    void should_EncryptAndDecryptData_Successfully() throws Exception {
        // Given
        String originalText = "Sensitive Warehouse Data";
        byte[] originalData = originalText.getBytes(StandardCharsets.UTF_8);
        when(keyProvider.getKey(kekName)).thenReturn(activeKek);

        // When
        EncryptedData encrypted = cryptoService.encrypt(originalData);
        byte[] decrypted = cryptoService.decrypt(encrypted);

        // Then
        assertThat(new String(decrypted, StandardCharsets.UTF_8)).isEqualTo(originalText);
        assertThat(encrypted.kekName()).isEqualTo(kekName);
        assertThat(encrypted.ciphertext()).isNotEqualTo(originalData);
    }

    @Test
    @DisplayName("should_ThrowException_When_KekMissing")
    void should_ThrowException_When_KekMissing() {
        // Given
        when(keyProvider.getActiveKey()).thenReturn(null);

        // When/Then
        assertThatThrownBy(() -> cryptoService.encrypt(new byte[]{1, 2, 3}))
                .isInstanceOf(EncryptionException.class)
                .hasMessageContaining("Active KEK not found");
    }

    @Test
    @DisplayName("should_PrepareStreamEncryptionAndDecryption_Successfully")
    void should_PrepareStreamEncryptionAndDecryption_Successfully() throws Exception {
        // When (prepare encryption)
        StreamEncryptedData streamData = cryptoService.prepareStreamEncryption();

        // Then
        assertThat(streamData).isNotNull();
        assertThat(streamData.kekName()).isEqualTo(kekName);
        assertThat(streamData.dataCipher()).isNotNull();

        // When (prepare decryption)
        when(keyProvider.getKey(kekName)).thenReturn(activeKek);
        var decryptCipher = cryptoService.prepareStreamDecryption(
                streamData.kekName(),
                streamData.encryptedDek(),
                streamData.dekIv(),
                streamData.dataIv());

        // Then
        assertThat(decryptCipher).isNotNull();
    }
}
