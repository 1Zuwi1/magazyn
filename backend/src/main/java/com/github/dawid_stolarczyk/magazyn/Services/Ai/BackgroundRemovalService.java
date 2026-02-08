package com.github.dawid_stolarczyk.magazyn.Services.Ai;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * Service for removing backgrounds from product images using the rembg microservice.
 * Falls back gracefully to the original image if the service is unavailable.
 */
@Slf4j
@Service
public class BackgroundRemovalService {

    @Value("${app.background-removal.enabled:true}")
    private boolean enabled;

    @Value("${app.background-removal.url:http://localhost:7000/api/remove}")
    private String rembgUrl;

    @Value("${app.background-removal.timeout-seconds:30}")
    private int timeoutSeconds;

    @Value("${app.background-removal.save-test-images:false}")
    private boolean saveTestImages;

    @Value("${app.background-removal.test-images-path:./test-images}")
    private String testImagesPath;

    private HttpClient httpClient;

    @PostConstruct
    public void init() {
        httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .version(HttpClient.Version.HTTP_1_1)
                .build();
        log.info("BackgroundRemovalService initialized (enabled={}, url={})", enabled, rembgUrl);

        if (saveTestImages) {
            try {
                Path testPath = Paths.get(testImagesPath);
                if (!Files.exists(testPath)) {
                    Files.createDirectories(testPath);
                    log.info("Created test images directory: {}", testPath.toAbsolutePath());
                } else {
                    log.info("Test images will be saved to: {}", testPath.toAbsolutePath());
                }
            } catch (IOException e) {
                log.warn("Failed to create test images directory: {}", e.getMessage());
            }
        }
    }

    /**
     * Removes the background from an image using the rembg service.
     * Returns the processed image with a white background, or null on failure.
     *
     * @param imageBytes the original image bytes
     * @return processed image bytes with white background, or null if removal failed
     */
    public byte[] removeBackground(byte[] imageBytes) {
        if (!enabled) {
            log.debug("Background removal is disabled");
            return null;
        }

        try {
            String boundary = UUID.randomUUID().toString();
            byte[] multipartBody = buildMultipartBody(boundary, imageBytes);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(rembgUrl))
                    .timeout(Duration.ofSeconds(timeoutSeconds))
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(multipartBody))
                    .build();

            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());

            if (response.statusCode() != 200) {
                log.warn("Background removal service returned status {}", response.statusCode());
                return null;
            }

            byte[] rgbaBytes = response.body();
            byte[] rgbBytes = compositeOntoWhiteBackground(rgbaBytes);

            if (saveTestImages) {
                saveTestImage(imageBytes, rgbBytes);
            }

            log.debug("Background removed successfully ({} bytes -> {} bytes)", imageBytes.length, rgbBytes.length);
            return rgbBytes;
        } catch (IOException e) {
            log.warn("Background removal service unavailable: {}", e.getMessage());
            return null;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("Background removal interrupted");
            return null;
        } catch (Exception e) {
            log.warn("Background removal failed: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Builds a multipart/form-data request body with the image as the "file" field.
     */
    private byte[] buildMultipartBody(String boundary, byte[] imageBytes) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        String header = "--" + boundary + "\r\n"
                + "Content-Disposition: form-data; name=\"file\"; filename=\"image.png\"\r\n"
                + "Content-Type: application/octet-stream\r\n"
                + "\r\n";
        baos.write(header.getBytes(StandardCharsets.UTF_8));
        baos.write(imageBytes);
        String footer = "\r\n--" + boundary + "--\r\n";
        baos.write(footer.getBytes(StandardCharsets.UTF_8));
        return baos.toByteArray();
    }

    /**
     * Composites an RGBA PNG image onto a white background, producing an RGB PNG.
     * This ensures ResNet18 receives a 3-channel image without transparency artifacts.
     */
    private byte[] compositeOntoWhiteBackground(byte[] rgbaBytes) throws IOException {
        BufferedImage rgbaImage = ImageIO.read(new ByteArrayInputStream(rgbaBytes));
        if (rgbaImage == null) {
            throw new IOException("Failed to decode image from background removal service");
        }

        BufferedImage rgbImage = new BufferedImage(
                rgbaImage.getWidth(), rgbaImage.getHeight(), BufferedImage.TYPE_INT_RGB);

        Graphics2D g = rgbImage.createGraphics();
        g.setColor(Color.WHITE);
        g.fillRect(0, 0, rgbImage.getWidth(), rgbImage.getHeight());
        g.drawImage(rgbaImage, 0, 0, null);
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(rgbImage, "png", baos);
        return baos.toByteArray();
    }

    /**
     * Saves original and processed images to the test images directory for debugging.
     * Filenames include timestamp for easy identification.
     */
    private void saveTestImage(byte[] originalBytes, byte[] processedBytes) {
        try {
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss_SSS"));
            Path basePath = Paths.get(testImagesPath);

            Path originalPath = basePath.resolve(timestamp + "_original.png");
            Path processedPath = basePath.resolve(timestamp + "_nobg.png");

            Files.write(originalPath, originalBytes);
            Files.write(processedPath, processedBytes);

            log.info("Saved test images: {} and {}", originalPath.getFileName(), processedPath.getFileName());
        } catch (IOException e) {
            log.warn("Failed to save test images: {}", e.getMessage());
        }
    }
}
