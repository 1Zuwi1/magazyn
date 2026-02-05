package com.github.dawid_stolarczyk.magazyn.Services.Ai;

import ai.djl.MalformedModelException;
import ai.djl.inference.Predictor;
import ai.djl.modality.cv.Image;
import ai.djl.modality.cv.ImageFactory;
import ai.djl.repository.zoo.Criteria;
import ai.djl.repository.zoo.ModelNotFoundException;
import ai.djl.repository.zoo.ZooModel;
import ai.djl.translate.TranslateException;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;

/**
 * Service for generating image embeddings using CLIP-like models.
 * Converts images to 512-dimensional float vectors for similarity search.
 */
@Slf4j
@Service
public class ImageEmbeddingService {

    private static final int EMBEDDING_DIMENSION = 512;
    private static final List<String> ALLOWED_CONTENT_TYPES = List.of(
            "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/bmp"
    );

    private ZooModel<Image, float[]> model;
    private Predictor<Image, float[]> predictor;
    private boolean modelLoaded = false;

    /**
     * Initializes the CLIP model on application startup.
     * Uses DJL's model zoo to load a pretrained image embedding model.
     */
    @PostConstruct
    public void init() {
        try {
            log.info("Loading image embedding model...");

            // Use ResNet50 as a fallback embedding model since CLIP requires special setup
            // In production, you would configure a proper CLIP model endpoint or local model
            Criteria<Image, float[]> criteria = Criteria.builder()
                    .setTypes(Image.class, float[].class)
                    .optModelUrls("djl://ai.djl.pytorch/resnet50_embedding")
                    .optEngine("PyTorch")
                    .optProgress(new ai.djl.training.util.ProgressBar())
                    .build();

            model = criteria.loadModel();
            predictor = model.newPredictor();
            modelLoaded = true;

            log.info("Image embedding model loaded successfully");
        } catch (ModelNotFoundException | MalformedModelException | IOException e) {
            log.warn("Failed to load image embedding model. Visual identification will not be available: {}",
                    e.getMessage());
            modelLoaded = false;
        }
    }

    /**
     * Cleanup resources on application shutdown.
     */
    @PreDestroy
    public void cleanup() {
        if (predictor != null) {
            predictor.close();
        }
        if (model != null) {
            model.close();
        }
        log.info("Image embedding model resources released");
    }

    /**
     * Converts a MultipartFile image to a 512-dimensional embedding vector.
     *
     * @param file the image file to process
     * @return float array of 512 dimensions representing the image embedding
     * @throws ImageEmbeddingException if the image cannot be processed
     */
    public float[] getEmbedding(MultipartFile file) throws ImageEmbeddingException {
        validateFile(file);

        if (!modelLoaded) {
            throw new ImageEmbeddingException("Image embedding model is not available");
        }

        try (InputStream inputStream = file.getInputStream()) {
            return getEmbedding(inputStream);
        } catch (IOException e) {
            log.error("Failed to read image file: {}", e.getMessage());
            throw new ImageEmbeddingException("Failed to read image file", e);
        }
    }

    /**
     * Converts an InputStream image to a 512-dimensional embedding vector.
     *
     * @param inputStream the image input stream to process
     * @return float array of 512 dimensions representing the image embedding
     * @throws ImageEmbeddingException if the image cannot be processed
     */
    public float[] getEmbedding(InputStream inputStream) throws ImageEmbeddingException {
        if (!modelLoaded) {
            throw new ImageEmbeddingException("Image embedding model is not available");
        }

        try {
            Image image = ImageFactory.getInstance().fromInputStream(inputStream);
            float[] rawEmbedding = predictor.predict(image);

            // Normalize to 512 dimensions if needed
            return normalizeEmbedding(rawEmbedding);
        } catch (IOException e) {
            log.error("Failed to load image: {}", e.getMessage());
            throw new ImageEmbeddingException("Invalid image format or corrupted file", e);
        } catch (TranslateException e) {
            log.error("Failed to generate embedding: {}", e.getMessage());
            throw new ImageEmbeddingException("AI model failed to process image", e);
        }
    }

    /**
     * Validates that the file is a supported image format.
     */
    private void validateFile(MultipartFile file) throws ImageEmbeddingException {
        if (file == null || file.isEmpty()) {
            throw new ImageEmbeddingException("File is empty or null");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new ImageEmbeddingException(
                    "Unsupported image format. Allowed: JPEG, PNG, GIF, WebP, BMP");
        }
    }

    /**
     * Normalizes embedding to exactly 512 dimensions.
     * Pads with zeros if shorter, truncates if longer.
     */
    private float[] normalizeEmbedding(float[] embedding) {
        if (embedding.length == EMBEDDING_DIMENSION) {
            return embedding;
        }

        float[] normalized = new float[EMBEDDING_DIMENSION];
        int copyLength = Math.min(embedding.length, EMBEDDING_DIMENSION);
        System.arraycopy(embedding, 0, normalized, 0, copyLength);

        // L2 normalize the embedding
        float norm = 0f;
        for (float v : normalized) {
            norm += v * v;
        }
        norm = (float) Math.sqrt(norm);

        if (norm > 0) {
            for (int i = 0; i < normalized.length; i++) {
                normalized[i] /= norm;
            }
        }

        return normalized;
    }

    /**
     * Converts a float array embedding to a PostgreSQL vector string format.
     * Format: "[0.1, 0.2, 0.3, ...]"
     */
    public String embeddingToVectorString(float[] embedding) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < embedding.length; i++) {
            sb.append(embedding[i]);
            if (i < embedding.length - 1) {
                sb.append(",");
            }
        }
        sb.append("]");
        return sb.toString();
    }

    /**
     * Converts a similarity distance (0-2 for cosine) to a similarity score (0-1).
     * Cosine distance of 0 = identical (score 1.0)
     * Cosine distance of 2 = opposite (score 0.0)
     */
    public double distanceToSimilarityScore(double distance) {
        return 1.0 - (distance / 2.0);
    }

    /**
     * Checks if the embedding model is loaded and ready.
     */
    public boolean isModelLoaded() {
        return modelLoaded;
    }

    /**
     * Exception thrown when image embedding fails.
     */
    public static class ImageEmbeddingException extends Exception {
        public ImageEmbeddingException(String message) {
            super(message);
        }

        public ImageEmbeddingException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
