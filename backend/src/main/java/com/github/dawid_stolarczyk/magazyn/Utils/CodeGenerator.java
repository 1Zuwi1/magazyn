package com.github.dawid_stolarczyk.magazyn.Utils;

import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.UUID;

public class CodeGenerator {
    private static final String BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    private static final SecureRandom RANDOM = new SecureRandom();

    public static String generateWithBase62(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(BASE62.charAt(RANDOM.nextInt(BASE62.length())));
        }
        return sb.toString();
    }

    public static String generateBackupCodeWithBase62(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            if (i > 0 && i % 4 == 0) {
                sb.append('-');
            }
            sb.append(BASE62.charAt(RANDOM.nextInt(BASE62.length())));
        }
        return sb.toString();
    }

    public static String generateWithNumbers(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(RANDOM.nextInt(10));
        }
        return sb.toString();
    }

    public static String generateRandomBase64Url() {
        UUID uuid = java.util.UUID.randomUUID();
        ByteBuffer buffer = java.nio.ByteBuffer.allocate(16);
        buffer.putLong(uuid.getMostSignificantBits());
        buffer.putLong(uuid.getLeastSignificantBits());
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buffer.array());
    }

    public static int calculateGTIN14Checksum(String code) {
//        int sum = 0;
//        for (char c : code.toCharArray()) {
//            int digit = Character.getNumericValue(c);
//            sum += (digit * 3) + (digit * 1);
//        }
//        for (int i = 1; i <= 13; i++) {
//            if (i % 2 != 0)
//        }
        return 0;
    }
}
