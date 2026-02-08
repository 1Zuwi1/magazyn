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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;

/**
 * Service for generating image embeddings using deep learning models.
 * Converts images to 1000-dimensional float vectors for similarity search.
 *
 * <p>Note: This implementation uses ResNet18 as the default embedding model
 * for broad compatibility. ResNet models output 1000-dimensional vectors
 * corresponding to ImageNet class logits. For production use cases requiring
 * semantic understanding (e.g., "product looks similar"), consider integrating
 * a CLIP model instead, which provides better semantic similarity.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ImageEmbeddingService {

    private static final int EMBEDDING_DIMENSION = 1000;
    private static final List<String> ALLOWED_CONTENT_TYPES = List.of(
            "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/bmp"
    );

    private final BackgroundRemovalService backgroundRemovalService;

    private ZooModel<Image, float[]> model;
    private Predictor<Image, float[]> predictor;
    private boolean modelLoaded = false;

    /**
     * Initializes the image embedding model on application startup.
     * Uses DJL's model zoo to load a pretrained ResNet18 embedding model.
     *
     * <p>This method implements fail-fast behavior: if the model cannot be loaded,
     * the application will fail to start. This ensures visual identification is always
     * available and prevents silent degradation of functionality.</p>
     *
     * <p>For production environments requiring CLIP-based semantic search,
     * configure the model URL to point to a CLIP model endpoint or local ONNX model.</p>
     *
     * @throws RuntimeException if the model cannot be loaded
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
            String errorMsg = "CRITICAL: Failed to load image embedding model. Application cannot start without AI capabilities.";
            log.error("{} Error: {}", errorMsg, e.getMessage(), e);
            throw new RuntimeException(errorMsg, e);
        } catch (Exception e) {
            String errorMsg = "CRITICAL: Unexpected error loading image embedding model. Application cannot start.";
            log.error("{} Error: {}", errorMsg, e.getMessage(), e);
            throw new RuntimeException(errorMsg, e);
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
     * Converts a MultipartFile image to a 1000-dimensional embedding vector.
     *
     * @param file the image file to process
     * @return float array of 1000 dimensions representing the image embedding
     */
    public float[] getEmbedding(MultipartFile file) {
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
     * Converts an InputStream image to a 1000-dimensional embedding vector.
     * Applies background removal before generating the embedding.
     *
     * @param inputStream the image input stream to process
     * @return float array of 1000 dimensions representing the image embedding
     */
    public float[] getEmbedding(InputStream inputStream) {
        if (!modelLoaded) {
            throw new ImageEmbeddingException("Image embedding model is not available");
        }

        try {
            byte[] originalBytes = inputStream.readAllBytes();

            // Attempt background removal; fall back to original on failure
            byte[] imageBytes = originalBytes;
            byte[] processed = backgroundRemovalService.removeBackground(originalBytes);
            if (processed != null) {
                imageBytes = processed;
                log.debug("Using background-removed image for embedding");
            } else {
                log.debug("Using original image for embedding (background removal skipped or failed)");
            }

            return generateEmbeddingFromBytes(imageBytes);
        } catch (IOException e) {
            log.error("Failed to load image: {}", e.getMessage());
            throw new ImageEmbeddingException("Invalid image format or corrupted file", e);
        } catch (TranslateException e) {
            log.error("Failed to generate embedding: {}", e.getMessage());
            throw new ImageEmbeddingException("AI model failed to process image", e);
        }
    }

    /**
     * Generates an embedding from already-processed image bytes (no background removal).
     * Use this when background removal has already been applied to the image.
     *
     * @param imageBytes the pre-processed image bytes
     * @return float array of 1000 dimensions representing the image embedding
     */
    public float[] getEmbeddingFromProcessedImage(byte[] imageBytes) {
        if (!modelLoaded) {
            throw new ImageEmbeddingException("Image embedding model is not available");
        }

        try {
            return generateEmbeddingFromBytes(imageBytes);
        } catch (IOException e) {
            log.error("Failed to load image: {}", e.getMessage());
            throw new ImageEmbeddingException("Invalid image format or corrupted file", e);
        } catch (TranslateException e) {
            log.error("Failed to generate embedding: {}", e.getMessage());
            throw new ImageEmbeddingException("AI model failed to process image", e);
        }
    }

    private float[] generateEmbeddingFromBytes(byte[] imageBytes) throws IOException, TranslateException {
        Image image = ImageFactory.getInstance().fromInputStream(new ByteArrayInputStream(imageBytes));
        float[] rawEmbedding = predictor.predict(image);
        return normalizeEmbedding(rawEmbedding);
    }

    /**
     * Validates that the file is a supported image format.
     */
    private void validateFile(MultipartFile file) {
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
     * Normalizes embedding to exactly 1000 dimensions and applies L2 normalization.
     * ResNet models natively output 1000-dimensional vectors, so no truncation is needed.
     * Always applies L2 normalization to ensure consistent vector comparison.
     */
    private float[] normalizeEmbedding(float[] embedding) {
        if (embedding.length != EMBEDDING_DIMENSION) {
            log.warn("Expected embedding dimension {}, but got {}. This may indicate a model mismatch.",
                    EMBEDDING_DIMENSION, embedding.length);
            // Resize if needed (but this should not happen with ResNet)
            float[] result = new float[EMBEDDING_DIMENSION];
            int copyLength = Math.min(embedding.length, EMBEDDING_DIMENSION);
            System.arraycopy(embedding, 0, result, 0, copyLength);
            embedding = result;
        }

        // L2 normalize the embedding for consistent similarity comparison
        float norm = 0f;
        for (float v : embedding) {
            norm += v * v;
        }
        norm = (float) Math.sqrt(norm);

        if (norm > 0) {
            for (int i = 0; i < embedding.length; i++) {
                embedding[i] /= norm;
            }
        }

        return embedding;
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
    public static class ImageEmbeddingException extends RuntimeException {
        public ImageEmbeddingException(String message) {
            super(message);
        }

        public ImageEmbeddingException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
