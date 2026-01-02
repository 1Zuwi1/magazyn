package com.github.dawid_stolarczyk.magazyn.Model.Services;

import com.github.dawid_stolarczyk.magazyn.Model.Entities.EncryptionError;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicReference;

@Service
public class SecretsService {

  // For the commented-out part:
  public static class SecretEncJson {
    public String encryptedDek;
    public String ciphertext;
  }

  private final AtomicReference<String> cached = new AtomicReference<>();

  @Value("${app.secretPlaintext:}")
  private String secretPlaintext;

  @Value("${app.awsRegion:eu-north-1}")
  private String awsRegion;

  @Value("${app.kmsKeyId:alias/Test}")
  private String kmsKeyId;

  // private final ObjectMapper om = new ObjectMapper();

  public String loadSecret() {
    String existing = cached.get();
    if (existing != null)
      return existing;

    if (secretPlaintext == null || secretPlaintext.isBlank()) {
      throw new EncryptionError("SECRET_PLAINTEXT missing");
    }
    cached.compareAndSet(null, secretPlaintext);
    return cached.get();

    // The code below is for KMS decryption, currently not in use.

    // Boolean isDev = System.getProperty("spring.profiles.active",
    // "dev").equals("dev");

    // if (isDev) {
    // if (secretPlaintext == null || secretPlaintext.isBlank())
    // throw new EncryptionError("SECRET_PLAINTEXT missing in dev");
    // cached.compareAndSet(null, secretPlaintext);
    // return cached.get();
    // }

    // Path file = Path.of(System.getProperty("user.dir"), "secret.enc.json");
    // SecretEncJson payload = om.readValue(Files.readString(file),
    // SecretEncJson.class);
    // KmsSecretCrypto kms = new KmsSecretCrypto(awsRegion, kmsKeyId);
    // String secret = kms.decryptSecret(payload.encryptedDek,
    // payload.ciphertext);
    // cached.compareAndSet(null, secret);
    // return cached.get();

  }
}
