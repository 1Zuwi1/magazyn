//package com.github.dawid_stolarczyk.magazyn.Model.Services;
//
//import com.github.dawid_stolarczyk.magazyn.Exception.EncryptionError;
//import com.github.dawid_stolarczyk.magazyn.Services.EncryptionService;
//import com.github.dawid_stolarczyk.magazyn.Services.SecretsService;
//import org.junit.jupiter.api.Test;
//import org.junit.jupiter.api.io.TempDir;
//
//import java.io.InputStream;
//import java.lang.reflect.Field;
//import java.nio.charset.StandardCharsets;
//import java.nio.file.Files;
//import java.nio.file.Path;
//import java.security.SecureRandom;
//import java.util.Base64;
//
//import static org.junit.jupiter.api.Assertions.assertArrayEquals;
//import static org.junit.jupiter.api.Assertions.assertEquals;
//import static org.junit.jupiter.api.Assertions.assertNotNull;
//import static org.junit.jupiter.api.Assertions.assertNull;
//import static org.junit.jupiter.api.Assertions.assertThrows;
//import static org.junit.jupiter.api.Assertions.assertTrue;
//
//class EncryptionServiceTest {
//
//  private static final class FixedSecretsService extends SecretsService {
//    private final String secret;
//
//    private FixedSecretsService(String secret) {
//      this.secret = secret;
//    }
//
//    @Override
//    public String loadSecret() {
//      return secret;
//    }
//  }
//
//  private static EncryptionService newService(Path rootDir, long maxFileBytes) {
//    return new EncryptionService(new FixedSecretsService("test-secret-32-bytes-long-value!"),
//        rootDir.toString(),
//        maxFileBytes);
//  }
//
//  @Test
//  void decryptRejectsCorruptedHeader() {
//    EncryptionService service = newService(Path.of(System.getProperty("user.dir")), 0);
//    String container = service.encrypt("hello");
//
//    byte[] buf = Base64.getDecoder().decode(container);
//    buf[0] ^= 0x01;
//    String corrupted = Base64.getEncoder().encodeToString(buf);
//
//    EncryptionError ex = assertThrows(EncryptionError.class, () -> service.decrypt(corrupted));
//    assertNotNull(ex.getCause());
//    assertEquals("Bad magic", ex.getCause().getMessage());
//  }
//
//  @Test
//  void decryptRejectsTruncatedHeader() {
//    EncryptionService service = newService(Path.of(System.getProperty("user.dir")), 0);
//    String truncated = Base64.getEncoder().encodeToString(new byte[] { 1, 2, 3 });
//
//    EncryptionError ex = assertThrows(EncryptionError.class, () -> service.decrypt(truncated));
//    assertNotNull(ex.getCause());
//    assertEquals("Truncated header", ex.getCause().getMessage());
//  }
//
//  @Test
//  void encryptRejectsNullOrBlank() {
//    EncryptionService service = newService(Path.of(System.getProperty("user.dir")), 0);
//
//    assertThrows(EncryptionError.class, () -> service.encrypt(null));
//    assertThrows(EncryptionError.class, () -> service.encrypt(""));
//    assertThrows(EncryptionError.class, () -> service.encrypt("   "));
//  }
//
//  @Test
//  void decryptRejectsNullOrBlank() {
//    EncryptionService service = newService(Path.of(System.getProperty("user.dir")), 0);
//
//    assertThrows(EncryptionError.class, () -> service.decrypt(null));
//    assertThrows(EncryptionError.class, () -> service.decrypt(""));
//    assertThrows(EncryptionError.class, () -> service.decrypt("   "));
//  }
//
//  @Test
//  void rejectsPathTraversal(@TempDir Path rootDir) {
//    EncryptionService service = newService(rootDir, 1024 * 1024);
//
//    assertThrows(EncryptionError.class, () -> service.encryptFile("../outside.txt"));
//    assertThrows(EncryptionError.class, () -> service.decryptFile("../outside"));
//  }
//
//  @Test
//  void decryptFileRejectsCorruptedHeader(@TempDir Path rootDir) throws Exception {
//    EncryptionService service = newService(rootDir, 0);
//    String container = service.encrypt("hello");
//
//    byte[] buf = Base64.getDecoder().decode(container);
//    buf[0] ^= 0x01;
//    Path enc = rootDir.resolve("bad.enc");
//    Files.write(enc, buf);
//
//    EncryptionError ex = assertThrows(EncryptionError.class,
//        () -> service.decryptFile(rootDir.resolve("bad").toString()));
//    assertNotNull(ex.getCause());
//    assertEquals("Bad magic", ex.getCause().getMessage());
//  }
//
//  @Test
//  void encryptFileRejectsOversizedFile(@TempDir Path rootDir) throws Exception {
//    EncryptionService service = newService(rootDir, 5);
//    Path src = rootDir.resolve("too-big.txt");
//    Files.write(src, new byte[16]);
//
//    EncryptionError ex = assertThrows(EncryptionError.class, () -> service.encryptFile(src.toString()));
//    assertEquals("encryptFile failed", ex.getMessage());
//    assertNotNull(ex.getCause());
//    assertEquals("Source file too large", ex.getCause().getMessage());
//  }
//
//  @Test
//  void decryptFileRejectsOversizedFile(@TempDir Path rootDir) throws Exception {
//    EncryptionService service = newService(rootDir, 1);
//    Path enc = rootDir.resolve("too-big.enc");
//    Files.write(enc, new byte[1024 * 1024]);
//
//    EncryptionError ex = assertThrows(EncryptionError.class,
//        () -> service.decryptFile(rootDir.resolve("too-big").toString()));
//    assertEquals("decryptFile failed", ex.getMessage());
//    assertNotNull(ex.getCause());
//    assertEquals("Encrypted file too large", ex.getCause().getMessage());
//  }
//
//  @Test
//  void encryptsAndDecryptsLargeFile(@TempDir Path rootDir) throws Exception {
//    EncryptionService service = newService(rootDir, 5 * 1024 * 1024);
//
//    byte[] data = new byte[2 * 1024 * 1024 + 123];
//    new SecureRandom().nextBytes(data);
//    Path src = rootDir.resolve("large.bin");
//    Files.write(src, data);
//
//    Path encryptedPath = service.encryptFile(src.toString());
//    assertTrue(Files.exists(Path.of(encryptedPath.toString())));
//
//    try (InputStream decrypted = service.decryptFile(src.toString())) {
//      byte[] roundTrip = decrypted.readAllBytes();
//      assertArrayEquals(data, roundTrip);
//    }
//  }
//
//  @Test
//  void clearsKeyOnStreamClose(@TempDir Path rootDir) throws Exception {
//    EncryptionService service = newService(rootDir, 1024 * 1024);
//
//    byte[] data = "secret".getBytes(StandardCharsets.UTF_8);
//    Path src = rootDir.resolve("small.txt");
//    Files.write(src, data);
//    service.encryptFile(src.toString());
//
//    InputStream decrypted = service.decryptFile(src.toString());
//    Field keyField = decrypted.getClass().getDeclaredField("keyToClear");
//    keyField.setAccessible(true);
//    byte[] key = (byte[]) keyField.get(decrypted);
//    assertNotNull(key);
//
//    decrypted.close();
//
//    assertNull(keyField.get(decrypted));
//    for (byte b : key) {
//      assertEquals(0, b);
//    }
//  }
//}
