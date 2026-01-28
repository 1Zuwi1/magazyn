package com.github.dawid_stolarczyk.magazyn.Security.Auth.PassKeys;

import com.yubico.webauthn.data.ByteArray;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public final class UserHandleUtil {

    private UserHandleUtil() {
    }

    public static ByteArray fromEmail(String email) {
        try {
            MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
            return new ByteArray(sha256.digest(email.toLowerCase().getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
