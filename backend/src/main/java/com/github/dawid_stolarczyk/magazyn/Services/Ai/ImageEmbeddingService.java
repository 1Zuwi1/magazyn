package com.github.dawid_stolarczyk.magazyn.Services.Ai;

import ai.djl.MalformedModelException;
import ai.djl.inference.Predictor;
import ai.djl.modality.cv.Image;
import ai.djl.modality.cv.ImageFactory;
import ai.djl.modality.cv.transform.Normalize;
import ai.djl.modality.cv.transform.ToTensor;
import ai.djl.ndarray.NDArray;
import ai.djl.ndarray.NDList;
import ai.djl.ndarray.NDManager;
import ai.djl.repository.zoo.Criteria;
import ai.djl.repository.zoo.ModelNotFoundException;
import ai.djl.repository.zoo.ZooModel;
import ai.djl.translate.Batchifier;
import ai.djl.translate.TranslateException;
import ai.djl.translate.Translator;
import ai.djl.translate.TranslatorContext;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;

/**
 * Service for generating image embeddings using deep learning models.
 * Converts images to 512-dimensional float vectors for similarity search.
 *
 * <p>Note: This implementation uses ResNet50 as the default embedding model
 * for broad compatibility. For production use cases requiring semantic understanding
 * (e.g., "product looks similar"), consider integrating a CLIP model instead.
 * ResNet50 embeddings capture visual features but may not provide the same
 * semantic similarity as CLIP for diverse product catalogs.</p>
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
     * Initializes the image embedding model on application startup.
     * Uses DJL's model zoo to load a pretrained ResNet50 embedding model.
     *
     * <p>For production environments requiring CLIP-based semantic search,
     * configure the model URL to point to a CLIP model endpoint or local ONNX model.</p>
     */
    @PostConstruct
    public void init() {
        try {
            log.info("Loading image embedding model...");

            // Use PyTorch ResNet18 model from model zoo
            Criteria<Image, float[]> criteria = Criteria.builder()
                    .setTypes(Image.class, float[].class)
                    .optApplication(ai.djl.Application.CV.IMAGE_CLASSIFICATION)
                    .optArtifactId("resnet")
                    .optEngine("PyTorch")
                    .optTranslator(new ImageNetTranslator())
                    .optProgress(new ai.djl.training.util.ProgressBar())
                    .build();

            model = criteria.loadModel();
            predictor = model.newPredictor();
            modelLoaded = true;

            log.info("Image embedding model loaded successfully");
        } catch (ModelNotFoundException | MalformedModelException | IOException e) {
            log.error("Failed to load image embedding model. Visual identification will not be available: {}",
                    e.getMessage(), e);
            modelLoaded = false;
        } catch (Exception e) {
            log.error("Unexpected error loading image embedding model: {}", e.getMessage(), e);
            modelLoaded = false;
        }
    }

    /**
     * Custom Translator for ImageNet-based models (ResNet).
     * Properly handles image preprocessing to avoid tensor dimension errors.
     */
    private static class ImageNetTranslator implements Translator<Image, float[]> {

        private static final int IMAGE_SIZE = 224;
        private static final float[] MEAN = {0.485f, 0.456f, 0.406f};
        private static final float[] STD = {0.229f, 0.224f, 0.225f};

        @Override
        public NDList processInput(TranslatorContext ctx, Image input) {
            NDManager manager = ctx.getNDManager();

            // Resize image to 224x224
            Image resized = input.resize(IMAGE_SIZE, IMAGE_SIZE, false);

            // Convert to NDArray [H, W, C]
            NDArray array = resized.toNDArray(manager);

            // Apply ToTensor: [H, W, C] -> [C, H, W] and scale to [0, 1]
            array = new ToTensor().transform(array);

            // Apply ImageNet normalization
            array = new Normalize(MEAN, STD).transform(array);

            // Add batch dimension: [C, H, W] -> [1, C, H, W]
            array = array.expandDims(0);

            return new NDList(array);
        }

        @Override
        public float[] processOutput(TranslatorContext ctx, NDList list) {
            NDArray output = list.singletonOrThrow();

            // Remove batch dimension if present
            if (output.getShape().dimension() > 1 && output.getShape().get(0) == 1) {
                output = output.squeeze(0);
            }

            return output.toFloatArray();
        }

        @Override
        public Batchifier getBatchifier() {
            return null; // We handle batching manually
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
     * Normalizes embedding to exactly 512 dimensions and applies L2 normalization.
     * Pads with zeros if shorter, truncates if longer.
     * Always applies L2 normalization to ensure consistent vector comparison.
     */
    private float[] normalizeEmbedding(float[] embedding) {
        float[] result;
        if (embedding.length == EMBEDDING_DIMENSION) {
            // Copy to avoid modifying input array during normalization
            result = embedding.clone();
        } else {
            result = new float[EMBEDDING_DIMENSION];
            int copyLength = Math.min(embedding.length, EMBEDDING_DIMENSION);
            System.arraycopy(embedding, 0, result, 0, copyLength);
        }

        // L2 normalize the embedding for consistent similarity comparison
        float norm = 0f;
        for (float v : result) {
            norm += v * v;
        }
        norm = (float) Math.sqrt(norm);

        if (norm > 0) {
            for (int i = 0; i < result.length; i++) {
                result[i] /= norm;
            }
        }

        return result;
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
