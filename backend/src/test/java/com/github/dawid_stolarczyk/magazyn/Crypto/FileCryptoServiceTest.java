package com.github.dawid_stolarczyk.magazyn.Crypto;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FileCryptoServiceTest {

    @Mock
    private CryptoService cryptoService;

    @InjectMocks
    private FileCryptoService fileCryptoService;

    private SecretKey mockKey;

    @BeforeEach
    void setUp() throws Exception {
        mockKey = KeyGenerator.getInstance("AES").generateKey();
    }

    @Test
    @DisplayName("should_EncryptAndDecryptStream_Successfully")
    void should_EncryptAndDecryptStream_Successfully() throws Exception {
        // Given
        String originalText = "File content to encrypt";
        byte[] originalData = originalText.getBytes(StandardCharsets.UTF_8);

        Cipher encryptCipher = Cipher.getInstance("AES/GCM/NoPadding");
        encryptCipher.init(Cipher.ENCRYPT_MODE, mockKey);

        StreamEncryptedData meta = new StreamEncryptedData(
                "test-kek",
                new byte[32],
                new byte[12],
                encryptCipher.getIV(),
                encryptCipher);

        when(cryptoService.prepareStreamEncryption()).thenReturn(meta);

        // When (Encrypt)
        ByteArrayOutputStream encryptedOut = new ByteArrayOutputStream();
        fileCryptoService.encrypt(new ByteArrayInputStream(originalData), encryptedOut);
        byte[] encryptedFileBytes = encryptedOut.toByteArray();

        // Then (Validate Header)
        assertThat(encryptedFileBytes.length).isGreaterThan(originalData.length);

        // Given (Prepare Decrypt)
        Cipher decryptCipher = Cipher.getInstance("AES/GCM/NoPadding");
        decryptCipher.init(Cipher.DECRYPT_MODE, mockKey, encryptCipher.getParameters());

        when(cryptoService.prepareStreamDecryption(anyString(), any(), any(), any()))
                .thenReturn(decryptCipher);

        // When (Decrypt)
        ByteArrayOutputStream decryptedOut = new ByteArrayOutputStream();
        fileCryptoService.decrypt(new ByteArrayInputStream(encryptedFileBytes), decryptedOut);

        // Then
        assertThat(new String(decryptedOut.toByteArray(), StandardCharsets.UTF_8)).isEqualTo(originalText);
    }
}
