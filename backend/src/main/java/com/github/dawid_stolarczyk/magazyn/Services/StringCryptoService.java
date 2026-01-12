package com.github.dawid_stolarczyk.magazyn.Services;

import com.github.dawid_stolarczyk.magazyn.Crypto.CryptoService;
import com.github.dawid_stolarczyk.magazyn.Crypto.EncryptedData;
import com.github.dawid_stolarczyk.magazyn.Exception.EncryptionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
public class StringCryptoService {

    @Autowired
    private CryptoService cryptoService;

    public String encrypt(String plainText) {
        try {
            byte[] data = plainText.getBytes(StandardCharsets.UTF_8);
            EncryptedData encrypted = cryptoService.encrypt(data);


            return Base64.getEncoder().encodeToString(encrypted.getCiphertext()) + ":" +
                    Base64.getEncoder().encodeToString(encrypted.getEncryptedDek()) + ":" +
                    Base64.getEncoder().encodeToString(encrypted.getIv()) + ":" +
                    Base64.getEncoder().encodeToString(encrypted.getDekIv()) + ":" +
                    encrypted.getKekName();
        } catch (Exception e) {
            throw new EncryptionException("Encryption error", e);
        }
    }

    public String decrypt(String encoded) {
        try {
            String[] parts = encoded.split(":");
            if (parts.length != 5) {
                throw new EncryptionException("Wrong encrypted data format");
            }

            byte[] ciphertext = Base64.getDecoder().decode(parts[0]);
            byte[] encryptedDek = Base64.getDecoder().decode(parts[1]);
            byte[] iv = Base64.getDecoder().decode(parts[2]);
            byte[] dekIv = Base64.getDecoder().decode(parts[3]);
            String kekName = parts[4];

            EncryptedData encryptedData = new EncryptedData(
                    ciphertext, encryptedDek, dekIv, iv, kekName
            );

            byte[] decrypted = cryptoService.decrypt(encryptedData);
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new EncryptionException("Encryption error", e);
        }
    }
}
