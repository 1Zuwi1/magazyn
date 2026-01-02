package com.github.dawid_stolarczyk.magazyn.Model.Services;

import org.springframework.stereotype.Service;

import com.github.dawid_stolarczyk.magazyn.Model.Entities.EncryptionError;
import com.github.dawid_stolarczyk.magazyn.Model.Utils.Hkdf;

import javax.crypto.Cipher;
import javax.crypto.CipherInputStream;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.nio.file.attribute.PosixFilePermissions;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

@Service
public class EncryptionService {

  private record WrappedDek(byte[] wrapSalt, byte[] dekWrapIv, byte[] dekWrapTag,
      byte[] dekWrapCt, byte[] dek) {
  }

  private record ParsedHeader(byte[] wrapSalt, byte[] dekWrapIv, byte[] dekWrapTag, byte[] dekWrapCt, byte[] dataIv,
      int headerBytes) {
  }

  private static final SecureRandom RNG = new SecureRandom();
  private static final String TRANSFORM = "AES/GCM/NoPadding";
  private static final int IV_LEN = 12;
  private static final int TAG_LEN = 16; // bytes
  private static final int DEK_LEN = 32; // bytes

  private static final int WRAP_SALT_LEN = 16; // bytes

  private static final byte[] MAGIC = new byte[] { 'E', 'N', 'C', '2' };

  // Header:
  // [ MAGIC(4) ][ wrapSalt(16) ][ dekWrapIv(12) ][ dekWrapTag(16) ][
  // dekWrapCt(32) ][ dataIv(12) ]
  private static final int HEADER_LEN = 4 + WRAP_SALT_LEN + IV_LEN + TAG_LEN + DEK_LEN + IV_LEN;

  private static byte[] deriveKEK(byte[] root, byte[] wrapSalt) {
    // HKDF-SHA256(root, salt=wrapSalt, info="kek-v2", len=32)
    return Hkdf.hkdfSha256(root, wrapSalt, "kek-v2".getBytes(StandardCharsets.UTF_8), 32);
  }

  private static byte[] buildHeader(byte[] wrapSalt, byte[] dekWrapIv, byte[] dekWrapTag, byte[] dekWrapCt,
      byte[] dataIv) {
    if (wrapSalt.length != WRAP_SALT_LEN ||
        dekWrapIv.length != IV_LEN ||
        dekWrapTag.length != TAG_LEN ||
        dekWrapCt.length != DEK_LEN ||
        dataIv.length != IV_LEN) {
      throw new EncryptionError("Invalid header component sizes");
    }

    byte[] out = new byte[HEADER_LEN];
    int o = 0;

    System.arraycopy(MAGIC, 0, out, o, 4);
    o += 4;
    System.arraycopy(wrapSalt, 0, out, o, WRAP_SALT_LEN);
    o += WRAP_SALT_LEN;
    System.arraycopy(dekWrapIv, 0, out, o, IV_LEN);
    o += IV_LEN;
    System.arraycopy(dekWrapTag, 0, out, o, TAG_LEN);
    o += TAG_LEN;
    System.arraycopy(dekWrapCt, 0, out, o, DEK_LEN);
    o += DEK_LEN;
    System.arraycopy(dataIv, 0, out, o, IV_LEN);

    return out;
  }

  private static ParsedHeader parseHeader(byte[] buf) {
    if (buf.length < HEADER_LEN)
      throw new EncryptionError("Truncated header");

    for (int i = 0; i < 4; i++) {
      if (buf[i] != MAGIC[i])
        throw new EncryptionError("Bad magic");
    }

    int o = 4;
    byte[] wrapSalt = slice(buf, o, WRAP_SALT_LEN);
    o += WRAP_SALT_LEN;
    byte[] dekWrapIv = slice(buf, o, IV_LEN);
    o += IV_LEN;
    byte[] dekWrapTag = slice(buf, o, TAG_LEN);
    o += TAG_LEN;
    byte[] dekWrapCt = slice(buf, o, DEK_LEN);
    o += DEK_LEN;
    byte[] dataIv = slice(buf, o, IV_LEN);
    o += IV_LEN;

    return new ParsedHeader(wrapSalt, dekWrapIv, dekWrapTag, dekWrapCt, dataIv, o);
  }

  private static byte[] aesGcmEncrypt(byte[] key32, byte[] iv12, byte[] plaintext) throws Exception {
    Cipher c = Cipher.getInstance(TRANSFORM);
    c.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(key32, "AES"), new GCMParameterSpec(128, iv12));
    return c.doFinal(plaintext); // ct||tag
  }

  // ===== Internals =====

  private static byte[] aesGcmDecrypt(byte[] key32, byte[] iv12, byte[] ctPlusTag) throws Exception {
    Cipher c = Cipher.getInstance(TRANSFORM);
    c.init(Cipher.DECRYPT_MODE, new SecretKeySpec(key32, "AES"), new GCMParameterSpec(128, iv12));
    return c.doFinal(ctPlusTag);
  }

  private static byte[] randomBytes(int n) {
    byte[] b = new byte[n];
    RNG.nextBytes(b);
    return b;
  }

  private static byte[] slice(byte[] src, int off, int len) {
    byte[] out = new byte[len];
    System.arraycopy(src, off, out, 0, len);
    return out;
  }

  private static byte[] concat(byte[] a, byte[] b) {
    byte[] out = new byte[a.length + b.length];
    System.arraycopy(a, 0, out, 0, a.length);
    System.arraycopy(b, 0, out, a.length, b.length);
    return out;
  }

  private static void zero(byte[] buf) {
    if (buf != null) {
      Arrays.fill(buf, (byte) 0);
    }
  }

  private static final class KeyClearingInputStream extends FilterInputStream {
    private byte[] keyToClear;
    private boolean closed;

    private KeyClearingInputStream(InputStream in, byte[] keyToClear) {
      super(in);
      this.keyToClear = keyToClear;
    }

    @Override
    public void close() throws IOException {
      if (closed) {
        return;
      }
      closed = true;
      try {
        super.close();
      } finally {
        zero(keyToClear);
        keyToClear = null;
      }
    }
  }

  private final SecretsService secrets;

  public EncryptionService(SecretsService secrets) {
    this.secrets = secrets;
  }

  // === encrypt(plaintext): base64 container ===
  public String encrypt(String plaintext) {
    WrappedDek wd = null;
    try {
      wd = generateWrappedDEK();
      byte[] dataIv = randomBytes(IV_LEN);

      byte[] ctPlusTag = aesGcmEncrypt(wd.dek, dataIv, plaintext.getBytes(StandardCharsets.UTF_8));

      byte[] header = buildHeader(wd.wrapSalt, wd.dekWrapIv, wd.dekWrapTag, wd.dekWrapCt, dataIv);

      byte[] container = concat(header, ctPlusTag);
      return Base64.getEncoder().encodeToString(container);
    } catch (Exception e) {
      throw new EncryptionError("encrypt failed", e);
    } finally {
      if (wd != null) {
        zero(wd.dek);
      }
    }
  }

  // === decrypt(containerB64): plaintext ===
  public String decrypt(String containerB64) {
    byte[] dek = null;
    try {
      byte[] buf = Base64.getDecoder().decode(containerB64);
      ParsedHeader ph = parseHeader(buf);

      if (buf.length < ph.headerBytes + TAG_LEN)
        throw new EncryptionError("Truncated data");

      byte[] ctPlusTag = new byte[buf.length - ph.headerBytes];
      System.arraycopy(buf, ph.headerBytes, ctPlusTag, 0, ctPlusTag.length);

      dek = unwrapDEK(ph.wrapSalt, ph.dekWrapIv, ph.dekWrapTag, ph.dekWrapCt);
      byte[] pt = aesGcmDecrypt(dek, ph.dataIv, ctPlusTag);

      return new String(pt, StandardCharsets.UTF_8);
    } catch (Exception e) {
      throw new EncryptionError("decrypt failed", e);
    } finally {
      zero(dek);
    }
  }

  // === encryptFile(filePath): writes <filePath>.enc atomically; deletes source
  // ===
  public String encryptFile(String filePath) {
    Path src = Path.of(filePath);
    Path tmp = Path.of(filePath + ".enc." + ProcessHandle.current().pid() + "." + System.currentTimeMillis() + ".part");
    Path out = Path.of(filePath + ".enc");
    WrappedDek wd = null;

    try {
      if (!Files.isRegularFile(src)) {
        throw new EncryptionError("Source is not a file");
      }

      wd = generateWrappedDEK();
      byte[] dataIv = randomBytes(IV_LEN);

      // Best-effort permissions (POSIX only). If unsupported, we just keep going.
      try {
        Files.createFile(tmp);
        Files.setPosixFilePermissions(tmp, PosixFilePermissions.fromString("rw-------"));
      } catch (UnsupportedOperationException ignored) {
        // non-POSIX FS
      } catch (FileAlreadyExistsException ignored) {
        // extremely unlikely
      }

      Cipher cipher = Cipher.getInstance(TRANSFORM);
      cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(wd.dek, "AES"), new GCMParameterSpec(128, dataIv));

      byte[] inBuf = new byte[1024 * 1024]; // 1 MiB
      byte[] outBuf = new byte[inBuf.length + 32]; // extra room for cipher output (GCM final adds tag)

      try (InputStream fis = new BufferedInputStream(Files.newInputStream(src, StandardOpenOption.READ), inBuf.length);
          OutputStream fos = new BufferedOutputStream(
              Files.newOutputStream(tmp, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING),
              inBuf.length)) {

        // Header first
        fos.write(buildHeader(wd.wrapSalt, wd.dekWrapIv, wd.dekWrapTag, wd.dekWrapCt, dataIv));

        int n;
        while ((n = fis.read(inBuf)) != -1) {
          int produced = cipher.update(inBuf, 0, n, outBuf, 0);
          if (produced > 0) {
            fos.write(outBuf, 0, produced);
          }
        }

        int finalProduced = cipher.doFinal(outBuf, 0);
        if (finalProduced > 0) {
          fos.write(outBuf, 0, finalProduced);
        }

        fos.flush();
      }

      // Atomic promote & remove source
      Files.move(tmp, out, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
      Files.delete(src);

      return out.toString();
    } catch (Exception e) {
      // Don't leak temp files on failure
      try {
        Files.deleteIfExists(tmp);
      } catch (Exception ignored) {
      }
      throw new EncryptionError("encryptFile failed", e);
    } finally {
      if (wd != null) {
        zero(wd.dek);
      }
    }
  }

  /**
   * decryptFile(encryptedPath): opens (encryptedPath + ".enc") and returns
   * plaintext InputStream.
   * This streams: it skips the header and feeds ciphertext+tag into
   * CipherInputStream.
   */
  public InputStream decryptFile(String encryptedPath) {
    Path enc = Path.of(encryptedPath + ".enc");
    InputStream in = null;
    byte[] dek = null;
    try {
      if (!Files.isRegularFile(enc))
        throw new EncryptionError("Encrypted file not found: " + enc);

      in = new BufferedInputStream(Files.newInputStream(enc, StandardOpenOption.READ));

      // Read header
      byte[] header = in.readNBytes(HEADER_LEN);
      if (header.length != HEADER_LEN)
        throw new EncryptionError("Truncated file");

      ParsedHeader ph = parseHeader(header);
      dek = unwrapDEK(ph.wrapSalt, ph.dekWrapIv, ph.dekWrapTag, ph.dekWrapCt);

      Cipher decipher = Cipher.getInstance(TRANSFORM);
      decipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(dek, "AES"), new GCMParameterSpec(128, ph.dataIv));

      return new KeyClearingInputStream(new CipherInputStream(in, decipher), dek);
    } catch (Exception e) {
      if (in != null) {
        try {
          in.close();
        } catch (IOException ignored) {
        }
      }
      zero(dek);
      throw new EncryptionError("decryptFile failed", e);
    }
  }

  private WrappedDek generateWrappedDEK() throws Exception {
    byte[] root = secrets.loadSecret().getBytes(StandardCharsets.UTF_8);
    byte[] kek = null;

    try {
      byte[] wrapSalt = randomBytes(WRAP_SALT_LEN);
      kek = deriveKEK(root, wrapSalt);

      byte[] dek = randomBytes(DEK_LEN);
      byte[] dekWrapIv = randomBytes(IV_LEN);

      byte[] wrapCtPlusTag = aesGcmEncrypt(kek, dekWrapIv, dek);
      if (wrapCtPlusTag.length != DEK_LEN + TAG_LEN)
        throw new EncryptionError("Wrapped DEK length mismatch");

      byte[] dekWrapCt = new byte[DEK_LEN];
      byte[] dekWrapTag = new byte[TAG_LEN];
      System.arraycopy(wrapCtPlusTag, 0, dekWrapCt, 0, DEK_LEN);
      System.arraycopy(wrapCtPlusTag, DEK_LEN, dekWrapTag, 0, TAG_LEN);

      return new WrappedDek(wrapSalt, dekWrapIv, dekWrapTag, dekWrapCt, dek);
    } finally {
      zero(root);
      zero(kek);
    }
  }

  private byte[] unwrapDEK(byte[] wrapSalt, byte[] dekWrapIv, byte[] dekWrapTag, byte[] dekWrapCt) throws Exception {
    byte[] root = secrets.loadSecret().getBytes(StandardCharsets.UTF_8);
    byte[] kek = null;

    try {
      kek = deriveKEK(root, wrapSalt);

      byte[] wrapCtPlusTag = concat(dekWrapCt, dekWrapTag);
      byte[] dek = aesGcmDecrypt(kek, dekWrapIv, wrapCtPlusTag);
      if (dek.length != DEK_LEN)
        throw new EncryptionError("Unwrapped DEK length mismatch");
      return dek;
    } finally {
      zero(root);
      zero(kek);
    }
  }
}
