package com.github.dawid_stolarczyk.magazyn.Crypto;

import com.github.dawid_stolarczyk.magazyn.Exception.EncryptionException;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Component
public class CryptoKeyProvider {

    private final Map<String, SecretKey> keys = new HashMap<>();
    @Getter
    private String activeKeyName = null;

    @PostConstruct
    private void init() {
        System.getenv().forEach((k, v) -> {
            if (k.startsWith("AES_KEY_")) {
                SecretKey key = load(k, v);
                keys.put(k, key);
                activeKeyName = k;
            }
        });
        if (activeKeyName == null) {
            throw new EncryptionException("Environment variable AES_KEY_<name> not found");
        }
    }

    private SecretKey load(String keyName, String base64) {
        if (base64 == null || base64.isEmpty()) {
            throw new EncryptionException("Crypto key " + keyName + " is empty");
        }
        byte[] decoded = Base64.getDecoder().decode(base64);
        return new SecretKeySpec(decoded, "AES");
    }

    public SecretKey getActiveKey() {
        return keys.get(activeKeyName);
    }

    public SecretKey getKey(String name) {
        return keys.get(name);
    }

    public Map<String, SecretKey> getAllKeys() {
        return keys;
    }
}
