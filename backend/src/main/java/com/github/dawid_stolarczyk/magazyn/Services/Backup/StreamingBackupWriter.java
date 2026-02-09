package com.github.dawid_stolarczyk.magazyn.Services.Backup;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.dawid_stolarczyk.magazyn.Crypto.FileCryptoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.io.PipedInputStream;
import java.io.PipedOutputStream;
import java.util.concurrent.*;

/**
 * Helper class for streaming backup data: JSON serialization → Encryption → S3 Upload
 * without buffering full data in RAM.
 */
@Slf4j
@RequiredArgsConstructor
public class StreamingBackupWriter {

    private final ObjectMapper objectMapper;
    private final FileCryptoService fileCryptoService;
    private final BackupStorageService backupStorageService;
    private final ExecutorService executorService;

    /**
     * Streams data to S3: Object → JSON → Encrypt → Upload
     *
     * @return total bytes uploaded
     */
    public long writeAndUpload(String basePath, String fileName, Object data) throws Exception {
        PipedOutputStream jsonOut = new PipedOutputStream();
        PipedInputStream jsonIn = new PipedInputStream(jsonOut, 1024 * 1024); // 1MB buffer

        PipedOutputStream encryptOut = new PipedOutputStream();
        PipedInputStream encryptIn = new PipedInputStream(encryptOut, 1024 * 1024); // 1MB buffer

        // Task 1: JSON serialization
        Future<Void> jsonTask = executorService.submit(() -> {
            try (jsonOut) {
                objectMapper.writeValue(jsonOut, data);
            } catch (IOException e) {
                throw new RuntimeException("JSON serialization failed", e);
            }
            return null;
        });

        // Task 2: Encryption
        Future<Void> encryptTask = executorService.submit(() -> {
            try (jsonIn; encryptOut) {
                fileCryptoService.encrypt(jsonIn, encryptOut);
            } catch (Exception e) {
                throw new RuntimeException("Encryption failed", e);
            }
            return null;
        });

        // Main thread: S3 upload
        long bytesUploaded;
        try (encryptIn) {
            bytesUploaded = backupStorageService.uploadBackupFileStream(basePath, fileName, encryptIn);
        }

        // Wait for completion and check for errors
        try {
            jsonTask.get(5, TimeUnit.MINUTES);
            encryptTask.get(5, TimeUnit.MINUTES);
        } catch (ExecutionException e) {
            throw new Exception("Streaming backup failed", e.getCause());
        } catch (TimeoutException e) {
            jsonTask.cancel(true);
            encryptTask.cancel(true);
            throw new Exception("Streaming backup timeout");
        }

        return bytesUploaded;
    }
}
