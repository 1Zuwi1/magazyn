package com.github.dawid_stolarczyk.magazyn.Crypto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class EncryptedData {
    private final byte[] ciphertext;
    private final byte[] encryptedDek;
    private final byte[] dekIv;
    private final byte[] iv;
    private final String kekName;
}
