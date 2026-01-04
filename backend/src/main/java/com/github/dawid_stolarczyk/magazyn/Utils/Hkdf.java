//package com.github.dawid_stolarczyk.magazyn.Utils;
//
//import javax.crypto.Mac;
//import javax.crypto.spec.SecretKeySpec;
//
//public final class Hkdf {
//  // HKDF (RFC 5869) with HMAC-SHA256
//  public static byte[] hkdfSha256(byte[] ikm, byte[] salt, byte[] info, int length) {
//    byte[] prk = extract("HmacSHA256", salt, ikm);
//    return expand("HmacSHA256", prk, info, length);
//  }
//
//  private static byte[] extract(String hmacAlg, byte[] salt, byte[] ikm) {
//    try {
//      Mac mac = Mac.getInstance(hmacAlg);
//      byte[] realSalt = (salt == null || salt.length == 0) ? new byte[mac.getMacLength()] : salt;
//      mac.init(new SecretKeySpec(realSalt, hmacAlg));
//      return mac.doFinal(ikm);
//    } catch (Exception e) {
//      throw new RuntimeException("HKDF extract failed", e);
//    }
//  }
//
//  private static byte[] expand(String hmacAlg, byte[] prk, byte[] info, int length) {
//    try {
//      Mac mac = Mac.getInstance(hmacAlg);
//      mac.init(new SecretKeySpec(prk, hmacAlg));
//
//      int hashLen = mac.getMacLength();
//      int n = (int) Math.ceil((double) length / hashLen);
//      if (n > 255)
//        throw new IllegalArgumentException("HKDF length too large");
//
//      byte[] okm = new byte[length];
//      byte[] t = new byte[0];
//      int pos = 0;
//
//      for (int i = 1; i <= n; i++) {
//        mac.reset();
//        mac.update(t);
//        if (info != null)
//          mac.update(info);
//        mac.update((byte) i);
//        t = mac.doFinal();
//
//        int copy = Math.min(hashLen, length - pos);
//        System.arraycopy(t, 0, okm, pos, copy);
//        pos += copy;
//      }
//      return okm;
//    } catch (Exception e) {
//      throw new RuntimeException("HKDF expand failed", e);
//    }
//  }
//
//  private Hkdf() {
//  }
//}
