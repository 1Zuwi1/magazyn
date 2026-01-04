package com.github.dawid_stolarczyk.magazyn.Model.Utils;

import com.github.dawid_stolarczyk.magazyn.Exception.EncryptionError;
import com.github.dawid_stolarczyk.magazyn.Utils.KmsSecretCrypto;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.kms.KmsClient;
import software.amazon.awssdk.services.kms.model.DecryptRequest;
import software.amazon.awssdk.services.kms.model.DecryptResponse;
import software.amazon.awssdk.services.kms.model.EncryptRequest;
import software.amazon.awssdk.services.kms.model.EncryptResponse;

import java.util.Base64;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class KmsSecretCryptoTest {

  @Test
  void encryptsAndDecryptsWithMockedKms() {
    KmsClient kms = mock(KmsClient.class);
    AtomicReference<byte[]> dekRef = new AtomicReference<>();

    when(kms.encrypt(any(EncryptRequest.class))).thenAnswer(invocation -> {
      EncryptRequest req = invocation.getArgument(0);
      dekRef.set(req.plaintext().asByteArray().clone());
      return EncryptResponse.builder()
          .ciphertextBlob(SdkBytes.fromByteArray(new byte[] { 1, 2, 3 }))
          .build();
    });
    when(kms.decrypt(any(DecryptRequest.class))).thenAnswer(invocation -> DecryptResponse.builder()
        .plaintext(SdkBytes.fromByteArray(dekRef.get()))
        .build());

    KmsSecretCrypto crypto = new KmsSecretCrypto(kms, "alias/test");
    try {
      String plaintext = "hello-kms";
      KmsSecretCrypto.EncryptedSecret encrypted = crypto.encryptSecret(plaintext);

      assertNotNull(encrypted);
      assertNotNull(encrypted.encryptedDekB64());
      assertNotNull(encrypted.ciphertextB64());
      assertNotNull(dekRef.get());

      String decrypted = crypto.decryptSecret(encrypted.encryptedDekB64(), encrypted.ciphertextB64());
      assertEquals(plaintext, decrypted);

      ArgumentCaptor<EncryptRequest> captor = ArgumentCaptor.forClass(EncryptRequest.class);
      verify(kms).encrypt(captor.capture());
      assertEquals("alias/test", captor.getValue().keyId());
      verify(kms).decrypt(any(DecryptRequest.class));
    } finally {
      crypto.close();
    }
  }

  @Test
  void decryptRejectsEmptyKmsPlaintext() {
    KmsClient kms = mock(KmsClient.class);
    when(kms.decrypt(any(DecryptRequest.class))).thenReturn(DecryptResponse.builder()
        .plaintext(SdkBytes.fromByteArray(new byte[0]))
        .build());

    KmsSecretCrypto crypto = new KmsSecretCrypto(kms, "alias/test");

    try {
      String encryptedDekB64 = Base64.getEncoder().encodeToString(new byte[] { 1, 2, 3 });
      byte[] ciphertext = new byte[32];
      String ciphertextB64 = Base64.getEncoder().encodeToString(ciphertext);

      EncryptionError ex = assertThrows(EncryptionError.class,
          () -> crypto.decryptSecret(encryptedDekB64, ciphertextB64));
      assertTrue(ex.getMessage().contains("decryptSecret failed"));
      assertNotNull(ex.getCause());
      assertEquals("KMS returned empty plaintext for DEK", ex.getCause().getMessage());
    } finally {
      crypto.close();
    }
  }
}
