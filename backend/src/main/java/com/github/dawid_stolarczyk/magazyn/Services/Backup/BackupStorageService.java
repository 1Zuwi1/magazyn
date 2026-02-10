package com.github.dawid_stolarczyk.magazyn.Services.Backup;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BackupStorageService {

    private final S3Client s3Client;

    @Value("${app.s3.bucket}")
    private String bucketName;

    @Value("${app.s3.backups-prefix:backups/}")
    private String backupsPrefix;

    private static final int MULTIPART_THRESHOLD = 5 * 1024 * 1024; // 5MB
    private static final int PART_SIZE = 2 * 1024 * 1024; // 2MB per part
    private static final int INITIAL_CHECK_SIZE = 64 * 1024; // 64KB for initial size check

    /**
     * Upload backup file from InputStream using streaming (no full buffering in RAM).
     * Uses multipart upload for files larger than 2MB.
     */
    public long uploadBackupFileStream(String basePath, String fileName, InputStream inputStream) throws IOException {
        String key = basePath + fileName;
        long totalBytes = 0;

        try {
            // Read small chunk first to check size (avoid large buffer allocation)
            byte[] checkBuffer = new byte[INITIAL_CHECK_SIZE];
            int bytesRead = readFully(inputStream, checkBuffer);

            if (bytesRead < INITIAL_CHECK_SIZE) {
                // Small file - single PUT (entire file fits in check buffer)
                byte[] trimmed = (bytesRead == checkBuffer.length) ? checkBuffer :
                        java.util.Arrays.copyOf(checkBuffer, bytesRead);
                s3Client.putObject(
                        PutObjectRequest.builder()
                                .bucket(bucketName)
                                .key(key)
                                .contentType("application/octet-stream")
                                .build(),
                        RequestBody.fromBytes(trimmed)
                );
                totalBytes = bytesRead;
                log.debug("Uploaded backup file (single-part): {} ({} bytes)", key, totalBytes);
            } else {
                // Large file detected - use multipart upload
                // Use the checkBuffer as first chunk and continue reading
                totalBytes = uploadMultipart(key, checkBuffer, bytesRead, inputStream);
                log.debug("Uploaded backup file (multipart): {} ({} bytes)", key, totalBytes);
            }
        } catch (Exception e) {
            log.error("Failed to upload backup file: {}", key, e);
            throw new IOException("S3 upload failed: " + e.getMessage(), e);
        }

        return totalBytes;
    }

    private long uploadMultipart(String key, byte[] firstChunk, int firstChunkSize, InputStream inputStream) throws IOException {
        CreateMultipartUploadResponse createResponse = s3Client.createMultipartUpload(
                CreateMultipartUploadRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .contentType("application/octet-stream")
                        .build()
        );

        String uploadId = createResponse.uploadId();
        List<CompletedPart> completedParts = new ArrayList<>();
        long totalBytes = 0;

        try {
            // Upload first chunk
            int partNumber = 1;
            completedParts.add(uploadPart(key, uploadId, partNumber++, firstChunk, firstChunkSize));
            totalBytes += firstChunkSize;

            // Upload remaining chunks
            byte[] buffer = new byte[PART_SIZE];
            int bytesRead;
            while ((bytesRead = readFully(inputStream, buffer)) > 0) {
                completedParts.add(uploadPart(key, uploadId, partNumber++, buffer, bytesRead));
                totalBytes += bytesRead;
            }

            // Complete multipart upload
            s3Client.completeMultipartUpload(
                    CompleteMultipartUploadRequest.builder()
                            .bucket(bucketName)
                            .key(key)
                            .uploadId(uploadId)
                            .multipartUpload(CompletedMultipartUpload.builder()
                                    .parts(completedParts)
                                    .build())
                            .build()
            );

            return totalBytes;

        } catch (Exception e) {
            // Abort multipart upload on error
            try {
                s3Client.abortMultipartUpload(
                        AbortMultipartUploadRequest.builder()
                                .bucket(bucketName)
                                .key(key)
                                .uploadId(uploadId)
                                .build()
                );
            } catch (Exception abortEx) {
                log.warn("Failed to abort multipart upload {}: {}", uploadId, abortEx.getMessage());
            }
            throw new IOException("Multipart upload failed", e);
        }
    }

    private CompletedPart uploadPart(String key, String uploadId, int partNumber, byte[] buffer, int length) {
        byte[] trimmed = (length == buffer.length) ? buffer :
                java.util.Arrays.copyOf(buffer, length);

        UploadPartResponse response = s3Client.uploadPart(
                UploadPartRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .uploadId(uploadId)
                        .partNumber(partNumber)
                        .contentLength((long) length)
                        .build(),
                RequestBody.fromBytes(trimmed)
        );

        return CompletedPart.builder()
                .partNumber(partNumber)
                .eTag(response.eTag())
                .build();
    }

    private int readFully(InputStream in, byte[] buffer) throws IOException {
        int totalRead = 0;
        while (totalRead < buffer.length) {
            int read = in.read(buffer, totalRead, buffer.length - totalRead);
            if (read == -1) break;
            totalRead += read;
        }
        return totalRead;
    }

    /**
     * Download backup file as InputStream (streaming, no buffering).
     * Caller MUST close the returned stream.
     */
    public InputStream downloadBackupFileStream(String basePath, String fileName) {
        String key = basePath + fileName;
        return s3Client.getObject(
                GetObjectRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .build()
        );
    }

    public void deleteBackup(String basePath) {
        try {
            ListObjectsV2Response listResponse = s3Client.listObjectsV2(
                    ListObjectsV2Request.builder()
                            .bucket(bucketName)
                            .prefix(basePath)
                            .build()
            );

            List<ObjectIdentifier> objectIds = listResponse.contents().stream()
                    .map(s3Object -> ObjectIdentifier.builder().key(s3Object.key()).build())
                    .toList();

            if (objectIds.isEmpty()) {
                return;
            }

            s3Client.deleteObjects(
                    DeleteObjectsRequest.builder()
                            .bucket(bucketName)
                            .delete(Delete.builder().objects(objectIds).build())
                            .build()
            );
            log.debug("Deleted {} objects from: {}", objectIds.size(), basePath);
        } catch (Exception e) {
            log.warn("Failed to delete backup files at {}: {}", basePath, e.getMessage());
        }
    }
}
