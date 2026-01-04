//package com.github.dawid_stolarczyk.magazyn.Utils;
//
//import com.fasterxml.jackson.databind.ObjectMapper;
//
//import org.springframework.boot.CommandLineRunner;
//import org.springframework.context.annotation.Profile;
//import org.springframework.stereotype.Component;
//
//import java.nio.file.Files;
//import java.nio.file.Path;
//import java.util.Map;
//
//@Component
//public class SecretEncGenerator implements CommandLineRunner {
//
//  // Set these env vars before running:
//  // SECRET_TO_ENCRYPT=...
//  // AWS_REGION=...
//  // KMS_KEY_ID=...
//  @Profile("!prod")
//  @Override
//  public void run(String... args) throws Exception {
//    String secret = System.getenv("SECRET_TO_ENCRYPT");
//    if (secret == null || secret.isBlank())
//      return; // don’t run unless requested
//
//    String region = System.getenv().getOrDefault("AWS_REGION", "eu-north-1");
//    String keyId = System.getenv().getOrDefault("KMS_KEY_ID", "alias/Test");
//
//    KmsSecretCrypto.EncryptedSecret out;
//    try (KmsSecretCrypto crypto = new KmsSecretCrypto(region, keyId)) {
//      out = crypto.encryptSecret(secret);
//    }
//
//    var json = Map.of(
//        "encryptedDek", out.encryptedDekB64(),
//        "ciphertext", out.ciphertextB64());
//
//    ObjectMapper om = new ObjectMapper();
//    Path file = Path.of(System.getProperty("user.dir"), "secret.enc.json");
//    Files.writeString(file, om.writerWithDefaultPrettyPrinter().writeValueAsString(json));
//  }
//}
