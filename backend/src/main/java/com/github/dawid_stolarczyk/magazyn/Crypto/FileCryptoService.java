package com.github.dawid_stolarczyk.magazyn.Crypto;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.CipherInputStream;
import javax.crypto.CipherOutputStream;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.InputStream;
import java.io.OutputStream;

@Service
public class FileCryptoService {
    @Autowired
    private CryptoService cryptoService;

    public void encrypt(InputStream in, OutputStream out) throws Exception {
        StreamEncryptedData meta = cryptoService.prepareStreamEncryption();

        DataOutputStream dos = new DataOutputStream(out);

        dos.writeInt(0x4D414731);
        dos.writeByte(meta.kekName().length());
        dos.write(meta.kekName().getBytes());
        dos.writeByte(meta.dekIv().length);
        dos.write(meta.dekIv());
        dos.writeShort(meta.encryptedDek().length);
        dos.write(meta.encryptedDek());
        dos.write(meta.dataIv().length);
        dos.write(meta.dataIv());

        try (CipherOutputStream cos = new CipherOutputStream(dos, meta.dataCipher())) {
            in.transferTo(cos);
        }
    }

    public void decrypt(InputStream in, OutputStream out) throws Exception {
        DataInputStream dis = new DataInputStream(in);

        if (dis.readInt() != 0x4D414731) {
            throw new IllegalArgumentException("Invalid file format");
        }

        byte[] kekName = dis.readNBytes(dis.readByte());
        byte[] dekIv = dis.readNBytes(dis.readByte());
        byte[] encryptedDek = dis.readNBytes(dis.readShort());
        byte[] dataIv = dis.readNBytes(dis.readByte());

        Cipher cipher = cryptoService.prepareStreamDecryption(
                new String(kekName),
                encryptedDek,
                dekIv,
                dataIv
        );

        try (CipherInputStream cis = new CipherInputStream(dis, cipher)) {
            cis.transferTo(out);
        }
    }
}
