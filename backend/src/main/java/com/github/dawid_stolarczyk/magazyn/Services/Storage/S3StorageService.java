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
        String resolvedContentType = contentType == null || contentType.isBlank()
                ? "application/octet-stream"
                : contentType;
        String objectKey = buildObjectKey(fileName);

        byte[] firstPartBuffer = new byte[MIN_PART_SIZE];
        int bytesRead = readFully(inputStream, firstPartBuffer);

        if (bytesRead < MIN_PART_SIZE) {
            // Mały plik: upload jednym żądaniem

            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(objectKey)
                    .contentType(resolvedContentType)
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromBytes(Arrays.copyOf(firstPartBuffer, bytesRead)));
            return;
        }

        // Duży plik: multipart upload
        CreateMultipartUploadRequest createRequest = CreateMultipartUploadRequest.builder()
                .bucket(bucketName)
                .key(objectKey)
                .contentType(resolvedContentType)
                .build();

        CreateMultipartUploadResponse createResponse = s3Client.createMultipartUpload(createRequest);
        String uploadId = createResponse.uploadId();
        List<CompletedPart> completedParts = new ArrayList<>();

        try {
            int partNumber = 1;

            // Wrzuć pierwszą część (już pobraną)
            completedParts.add(uploadPart(objectKey, uploadId, partNumber++, firstPartBuffer, bytesRead));

            // Czytaj i wrzucaj kolejne części
            byte[] loopBuffer = new byte[MIN_PART_SIZE];
            int currentRead;
            while ((currentRead = readFully(inputStream, loopBuffer)) > 0) {
                completedParts.add(uploadPart(objectKey, uploadId, partNumber++, loopBuffer, currentRead));
            }

            CompletedMultipartUpload completedUpload = CompletedMultipartUpload.builder()
                    .parts(completedParts)
                    .build();

            s3Client.completeMultipartUpload(CompleteMultipartUploadRequest.builder()
                    .bucket(bucketName)
                    .key(objectKey)
                    .uploadId(uploadId)
                    .multipartUpload(completedUpload)
                    .build());

        } catch (Exception ex) {
            s3Client.abortMultipartUpload(AbortMultipartUploadRequest.builder()
                    .bucket(bucketName)
                    .key(objectKey)
                    .uploadId(uploadId)
                    .build());
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

    @Override
    public InputStream download(String fileName) throws Exception {
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(buildObjectKey(fileName))
                .build();
        return s3Client.getObject(getObjectRequest);
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
        String prefix = itemsPrefix == null ? "" : itemsPrefix.trim();
        if (!prefix.isEmpty() && !prefix.endsWith("/")) {
            prefix = prefix + "/";
        }
        return prefix + fileName;
    }
}
