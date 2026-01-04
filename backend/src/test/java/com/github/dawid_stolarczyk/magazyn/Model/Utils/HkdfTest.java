package com.github.dawid_stolarczyk.magazyn.Model.Utils;

import com.github.dawid_stolarczyk.magazyn.Utils.Hkdf;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class HkdfTest {

  @Test
  void hkdfAllowsEmptySalt() {
    byte[] okm = Hkdf.hkdfSha256(
        "ikm".getBytes(StandardCharsets.UTF_8),
        new byte[0],
        "info".getBytes(StandardCharsets.UTF_8),
        32);

    assertEquals(32, okm.length);
  }

  @Test
  void hkdfRejectsOversizedLength() {
    byte[] ikm = "ikm".getBytes(StandardCharsets.UTF_8);
    byte[] info = "info".getBytes(StandardCharsets.UTF_8);
    int maxLen = 32 * 255;

    assertDoesNotThrow(() -> Hkdf.hkdfSha256(ikm, new byte[0], info, maxLen));
    RuntimeException ex = assertThrows(RuntimeException.class,
        () -> Hkdf.hkdfSha256(ikm, new byte[0], info, maxLen + 1));
    assertEquals(IllegalArgumentException.class, ex.getCause().getClass());
  }
}
