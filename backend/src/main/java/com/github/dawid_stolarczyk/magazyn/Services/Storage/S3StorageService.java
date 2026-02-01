package com.github.dawid_stolarczyk.magazyn.Services.Storage;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class S3StorageService implements StorageService {
    private final S3Client s3Client;
    private static final int MIN_PART_SIZE = 5 * 1024 * 1024; // 5MB

    @Value("${app.s3.bucket}")
    private String bucketName;

    @Value("${app.s3.items-prefix:items-photos/}")
    private String itemsPrefix;

    @Override
    public void uploadStream(String fileName, InputStream inputStream, String contentType) throws Exception {
        if (bucketName == null || bucketName.isBlank()) {
            throw new IllegalStateException("S3 bucket name is not configured");
        }

        String resolvedContentType = contentType == null || contentType.isBlank()
                ? "application/octet-stream"
                : contentType;
        String objectKey = buildObjectKey(fileName);

        // Pre-allocate buffer only once per upload or use a smaller initial check
        // To strictly address "per-upload 5MB buffer allocation", we could use a smaller
        // check buffer, but multipart upload REQUIRES at least 5MB for all parts except last.
        byte[] buffer = new byte[MIN_PART_SIZE];
        int bytesRead = readFully(inputStream, buffer);

        if (bytesRead < MIN_PART_SIZE) {
            // Small file: Single-part upload
            s3Client.putObject(PutObjectRequest.builder()
                            .bucket(bucketName)
                            .key(objectKey)
                            .contentType(resolvedContentType)
                            .build(),
                    RequestBody.fromBytes(Arrays.copyOf(buffer, bytesRead)));
            return;
        }

        // Large file: Multipart upload
        CreateMultipartUploadResponse createResponse = s3Client.createMultipartUpload(CreateMultipartUploadRequest.builder()
                .bucket(bucketName)
                .key(objectKey)
                .contentType(resolvedContentType)
                .build());

        String uploadId = createResponse.uploadId();
        List<CompletedPart> completedParts = new ArrayList<>();

        try {
            int partNumber = 1;
            // Upload first part
            completedParts.add(uploadPart(objectKey, uploadId, partNumber++, buffer, bytesRead));

            // Continue with subsequent parts
            while ((bytesRead = readFully(inputStream, buffer)) > 0) {
                completedParts.add(uploadPart(objectKey, uploadId, partNumber++, buffer, bytesRead));
            }

            s3Client.completeMultipartUpload(CompleteMultipartUploadRequest.builder()
                    .bucket(bucketName)
                    .key(objectKey)
                    .uploadId(uploadId)
                    .multipartUpload(CompletedMultipartUpload.builder().parts(completedParts).build())
                    .build());

        } catch (Exception ex) {
            try {
                s3Client.abortMultipartUpload(AbortMultipartUploadRequest.builder()
                        .bucket(bucketName)
                        .key(objectKey)
                        .uploadId(uploadId)
                        .build());
            } catch (Exception abortEx) {
                ex.addSuppressed(abortEx);
            }
            throw ex;
        }
    }

    private CompletedPart uploadPart(String key, String uploadId, int partNumber, byte[] buffer, int length) {
        UploadPartRequest uploadPartRequest = UploadPartRequest.builder()
                .bucket(bucketName)
                .key(key)
                .uploadId(uploadId)
                .partNumber(partNumber)
                .contentLength((long) length)
                .build();

        UploadPartResponse response = s3Client.uploadPart(uploadPartRequest,
                RequestBody.fromInputStream(new ByteArrayInputStream(buffer, 0, length), length));

        return CompletedPart.builder()
                .partNumber(partNumber)
                .eTag(response.eTag())
                .build();
    }

    private int readFully(InputStream in, byte[] buffer) throws Exception {
        int totalRead = 0;
        while (totalRead < buffer.length) {
            int read = in.read(buffer, totalRead, buffer.length - totalRead);
            if (read == -1) break;
            totalRead += read;
        }
        return totalRead;
    }

    /**
     * Downloads a file from S3.
     * <p>
     * IMPORTANT: The caller is responsible for closing the returned InputStream to release the underlying HTTP connection.
     * Failure to do so may lead to connection pool exhaustion.
     * </p>
     */
    @Override
    public InputStream download(String fileName) throws Exception {
        return s3Client.getObject(GetObjectRequest.builder()
                .bucket(bucketName)
                .key(buildObjectKey(fileName))
                .build());
    }

    @Override
    public void delete(String fileName) throws Exception {
        if (fileName == null || fileName.isBlank()) {
            return;
        }
        s3Client.deleteObject(DeleteObjectRequest.builder()
                .bucket(bucketName)
                .key(buildObjectKey(fileName))
                .build());
    }

    private String buildObjectKey(String fileName) {
        // Sanitize fileName to prevent path traversal (extract only the filename part)
        String sanitizedFileName = new java.io.File(fileName).getName();

        String prefix = itemsPrefix == null ? "" : itemsPrefix.trim();
        if (!prefix.isEmpty() && !prefix.endsWith("/")) {
            prefix = prefix + "/";
        }
        return prefix + sanitizedFileName;
    }
}
