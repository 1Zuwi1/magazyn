package com.github.dawid_stolarczyk.magazyn.Crypto;

public record EncryptedData(byte[] ciphertext, byte[] encryptedDek, byte[] dekIv, byte[] iv, String kekName) {
}
