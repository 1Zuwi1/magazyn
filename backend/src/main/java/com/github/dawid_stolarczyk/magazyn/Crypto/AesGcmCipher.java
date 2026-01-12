package com.github.dawid_stolarczyk.magazyn.Crypto;

import lombok.Getter;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import java.security.SecureRandom;

public class AesGcmCipher {

    private final SecretKey key;
    private final SecureRandom random = new SecureRandom();
    @Getter
    private byte[] iv;

    public AesGcmCipher(SecretKey key) {
        this.key = key;
    }

    public byte[] encrypt(byte[] data) throws Exception {
        iv = new byte[12];
        random.nextBytes(iv);

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(128, iv));
        return cipher.doFinal(data);
    }

    public byte[] decrypt(byte[] cipherText, byte[] iv) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(128, iv));
        return cipher.doFinal(cipherText);
    }

}
