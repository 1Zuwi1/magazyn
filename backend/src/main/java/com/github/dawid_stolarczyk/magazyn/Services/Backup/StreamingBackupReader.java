package com.github.dawid_stolarczyk.magazyn.Services.Backup;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.dawid_stolarczyk.magazyn.Crypto.FileCryptoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.io.*;
import java.util.concurrent.*;

/**
 * Helper class for streaming backup restore: S3 Download → Decryption → JSON deserialization
 * without buffering full data in RAM.
 */
@Slf4j
@RequiredArgsConstructor
public class StreamingBackupReader {

    private final ObjectMapper objectMapper;
    private final FileCryptoService fileCryptoService;
    private final BackupStorageService backupStorageService;
    private final ExecutorService executorService;

    /**
     * Streams data from S3: Download → Decrypt → JSON → Object
     */
    public <T> T downloadAndRead(String basePath, String fileName, TypeReference<T> typeRef) throws Exception {
        PipedOutputStream decryptOut = new PipedOutputStream();
        PipedInputStream decryptIn = new PipedInputStream(decryptOut, 1024 * 1024); // 1MB buffer

        // Task 1: Download + Decrypt
        Future<Void> decryptTask = executorService.submit(() -> {
            try (InputStream s3Stream = backupStorageService.downloadBackupFileStream(basePath, fileName);
                 decryptOut) {
                fileCryptoService.decrypt(s3Stream, decryptOut);
            } catch (Exception e) {
                throw new RuntimeException("Download/decryption failed", e);
            }
            return null;
        });

        // Main thread: JSON deserialization
        T result;
        try (decryptIn) {
            result = objectMapper.readValue(decryptIn, typeRef);
        }

        // Wait for decrypt task completion
        try {
            decryptTask.get(5, TimeUnit.MINUTES);
        } catch (ExecutionException e) {
            throw new Exception("Streaming restore failed", e.getCause());
        } catch (TimeoutException e) {
            decryptTask.cancel(true);
            throw new Exception("Streaming restore timeout");
        }

        return result;
    }

    /**
     * Variant for simple class types (not generic collections)
     */
    public <T> T downloadAndRead(String basePath, String fileName, Class<T> valueType) throws Exception {
        PipedOutputStream decryptOut = new PipedOutputStream();
        PipedInputStream decryptIn = new PipedInputStream(decryptOut, 1024 * 1024);

        Future<Void> decryptTask = executorService.submit(() -> {
            try (InputStream s3Stream = backupStorageService.downloadBackupFileStream(basePath, fileName);
                 decryptOut) {
                fileCryptoService.decrypt(s3Stream, decryptOut);
            } catch (Exception e) {
                throw new RuntimeException("Download/decryption failed", e);
            }
            return null;
        });

        T result;
        try (decryptIn) {
            result = objectMapper.readValue(decryptIn, valueType);
        }

        try {
            decryptTask.get(5, TimeUnit.MINUTES);
        } catch (ExecutionException e) {
            throw new Exception("Streaming restore failed", e.getCause());
        } catch (TimeoutException e) {
            decryptTask.cancel(true);
            throw new Exception("Streaming restore timeout");
        }

        return result;
    }
}
