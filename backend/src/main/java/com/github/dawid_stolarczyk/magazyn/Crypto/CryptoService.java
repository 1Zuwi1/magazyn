package com.github.dawid_stolarczyk.magazyn.Crypto;

import com.github.dawid_stolarczyk.magazyn.Exception.EncryptionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

@Service
public class CryptoService {

    @Autowired
    private CryptoKeyProvider keyProvider;


    public EncryptedData encrypt(byte[] data) throws Exception {
        KeyGenerator kg = KeyGenerator.getInstance("AES");
        kg.init(256);
        SecretKey dek = kg.generateKey();

        AesGcmCipher cipher = new AesGcmCipher(dek);
        byte[] ciphertext = cipher.encrypt(data);

        SecretKey kek = keyProvider.getActiveKey();
        AesGcmCipher dekCipher = new AesGcmCipher(kek);
        byte[] encryptedDek = dekCipher.encrypt(dek.getEncoded());
        byte[] dekIv = dekCipher.getIv();

        return new EncryptedData(ciphertext, encryptedDek, dekIv, cipher.getIv(), keyProvider.getActiveKeyName());
    }


    public byte[] decrypt(EncryptedData encryptedData) throws Exception {
        SecretKey kek = keyProvider.getKey(encryptedData.kekName());
        if (kek == null) {
            throw new EncryptionException("KEK not found: " + encryptedData.kekName());
        }

        AesGcmCipher dekCipher = new AesGcmCipher(kek);
        byte[] dekBytes = dekCipher.decrypt(encryptedData.encryptedDek(), encryptedData.dekIv());
        SecretKey dek = new SecretKeySpec(dekBytes, "AES");

        AesGcmCipher dataCipher = new AesGcmCipher(dek);
        return dataCipher.decrypt(encryptedData.ciphertext(), encryptedData.iv());
    }

    public StreamEncryptedData prepareStreamEncryption() throws Exception {
        KeyGenerator kg = KeyGenerator.getInstance("AES");
        kg.init(256);
        SecretKey dek = kg.generateKey();

        AesGcmCipher dataCipher = new AesGcmCipher(dek);
        Cipher cipher = dataCipher.encryptCipher();

        SecretKey kek = keyProvider.getActiveKey();
        AesGcmCipher dekCipher = new AesGcmCipher(kek);
        byte[] encryptedDek = dekCipher.encrypt(dek.getEncoded());

        return new StreamEncryptedData(keyProvider.getActiveKeyName(), encryptedDek, dekCipher.getIv(), dataCipher.getIv(), cipher);
    }

    public Cipher prepareStreamDecryption(
            String kekName,
            byte[] encryptedDek,
            byte[] dekIv,
            byte[] dataIv
    ) throws Exception {

        SecretKey kek = keyProvider.getKey(kekName);

        AesGcmCipher dekCipher = new AesGcmCipher(kek);
        byte[] dekBytes = dekCipher.decrypt(encryptedDek, dekIv);
        SecretKey dek = new SecretKeySpec(dekBytes, "AES");

        AesGcmCipher dataCipher = new AesGcmCipher(dek);
        return dataCipher.decryptCipher(dataIv);
    }


}
