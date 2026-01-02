package com.github.dawid_stolarczyk.magazyn.Model.Utils;

import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.kms.KmsClient;
import software.amazon.awssdk.services.kms.model.DecryptRequest;
import software.amazon.awssdk.services.kms.model.EncryptRequest;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import com.github.dawid_stolarczyk.magazyn.Model.Entities.EncryptionError;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

public class KmsSecretCrypto implements AutoCloseable {

  public record EncryptedSecret(String encryptedDekB64, String ciphertextB64) {
  }

  private static final SecureRandom RNG = new SecureRandom();
  private static final int IV_LEN = 12;

  private static final int TAG_LEN = 16; // bytes (128-bit)

  private static void zero(byte[] buf) {
    if (buf != null) {
      Arrays.fill(buf, (byte) 0);
    }
  }

  private static byte[] aesGcmEncrypt(byte[] key32, byte[] iv12, byte[] plaintext) throws Exception {
    Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
    c.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(key32, "AES"), new GCMParameterSpec(128, iv12));
    return c.doFinal(plaintext); // returns (ct || tag)
  }

  private static byte[] aesGcmDecrypt(byte[] key32, byte[] iv12, byte[] ctPlusTag) throws Exception {
    Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
    c.init(Cipher.DECRYPT_MODE, new SecretKeySpec(key32, "AES"), new GCMParameterSpec(128, iv12));
    return c.doFinal(ctPlusTag);
  }

  private final KmsClient kms;

  private final String kmsKeyId;

  public KmsSecretCrypto(String awsRegion, String kmsKeyId) {
    this.kms = KmsClient.builder().region(Region.of(awsRegion)).build();
    this.kmsKeyId = kmsKeyId;
  }

  @Override
  public void close() {
    kms.close();
  }

  public EncryptedSecret encryptSecret(String plaintext) {
    byte[] dek = null;
    try {
      dek = new byte[32];
      RNG.nextBytes(dek);

      byte[] iv = new byte[IV_LEN];
      RNG.nextBytes(iv);

      byte[] ctPlusTag = aesGcmEncrypt(dek, iv, plaintext.getBytes(StandardCharsets.UTF_8));

      // TS format: base64(iv || ct || tag)
      byte[] packed = new byte[iv.length + ctPlusTag.length];
      System.arraycopy(iv, 0, packed, 0, iv.length);
      System.arraycopy(ctPlusTag, 0, packed, iv.length, ctPlusTag.length);
      String ciphertextB64 = Base64.getEncoder().encodeToString(packed);

      var encResp = kms.encrypt(EncryptRequest.builder()
          .keyId(kmsKeyId)
          .plaintext(SdkBytes.fromByteArray(dek))
          .build());

      byte[] encryptedDek = encResp.ciphertextBlob().asByteArray();
      String encryptedDekB64 = Base64.getEncoder().encodeToString(encryptedDek);

      return new EncryptedSecret(encryptedDekB64, ciphertextB64);
    } catch (Exception e) {
      System.out.println("Encrypt secret error:" + e.getMessage());
      throw new EncryptionError("encryptSecret failed");
    } finally {
      zero(dek);
    }
  }

  public String decryptSecret(String encryptedDekB64, String ciphertextB64) {
    byte[] dek = null;
    try {
      byte[] encryptedDek = Base64.getDecoder().decode(encryptedDekB64);

      var decResp = kms.decrypt(DecryptRequest.builder()
          .ciphertextBlob(SdkBytes.fromByteArray(encryptedDek))
          .build());

      dek = decResp.plaintext().asByteArray();
      if (dek == null || dek.length == 0)
        throw new EncryptionError("KMS returned empty plaintext for DEK");

      byte[] packed = Base64.getDecoder().decode(ciphertextB64);
      if (packed.length < IV_LEN + TAG_LEN)
        throw new EncryptionError("Ciphertext too short");

      byte[] iv = new byte[IV_LEN];
      System.arraycopy(packed, 0, iv, 0, IV_LEN);

      byte[] ctPlusTag = new byte[packed.length - IV_LEN];
      System.arraycopy(packed, IV_LEN, ctPlusTag, 0, ctPlusTag.length);

      byte[] pt = aesGcmDecrypt(dek, iv, ctPlusTag);
      return new String(pt, StandardCharsets.UTF_8);
    } catch (Exception e) {
      throw new EncryptionError("decryptSecret failed");
    } finally {
      zero(dek);
    }
  }
}
