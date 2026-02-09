package com.github.dawid_stolarczyk.magazyn.Services.Inventory;

import com.github.dawid_stolarczyk.magazyn.Common.Enums.InventoryError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ItemCreateRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ItemDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ItemUpdateRequest;
import com.github.dawid_stolarczyk.magazyn.Crypto.FileCryptoService;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Item;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.ItemRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.Specification.ItemSpecifications;
import com.github.dawid_stolarczyk.magazyn.Services.Ai.BackgroundRemovalService;
import com.github.dawid_stolarczyk.magazyn.Services.Ai.ImageEmbeddingService;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.RateLimitOperation;
import com.github.dawid_stolarczyk.magazyn.Services.Storage.StorageService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.task.AsyncTaskExecutor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import static com.github.dawid_stolarczyk.magazyn.Utils.InternetUtils.getClientIp;

@Slf4j
@Service
@RequiredArgsConstructor
public class ItemService {
    private final ItemRepository itemRepository;
    private final FileCryptoService fileCryptoService;
    private final StorageService storageService;
    private final BarcodeService barcodeService;
    private final Bucket4jRateLimiter rateLimiter;
    private final SmartCodeService smartCodeService;
    private final ImageEmbeddingService imageEmbeddingService;
    private final BackgroundRemovalService backgroundRemovalService;
    @Qualifier("asyncTaskExecutor")
    private final AsyncTaskExecutor asyncTaskExecutor;

    public Page<ItemDto> getAllItemsPaged(
            HttpServletRequest request,
            Pageable pageable,
            String search,
            Boolean dangerous,
            Float minTempFrom,
            Float minTempTo,
            Float maxTempFrom,
            Float maxTempTo,
            Float weightFrom,
            Float weightTo,
            Long expireAfterDaysFrom,
            Long expireAfterDaysTo) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);

        var spec = ItemSpecifications.withFilters(
                search, dangerous, minTempFrom, minTempTo, maxTempFrom, maxTempTo,
                weightFrom, weightTo, expireAfterDaysFrom, expireAfterDaysTo);

        return itemRepository.findAll(spec, pageable).map(this::mapToDto);
    }

    public ItemDto getItemById(Long id, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.ITEM_NOT_FOUND.name()));
        return mapToDto(item);
    }

    public ItemDto getItemByCode(String code, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);
        Item item = findItemBySmartCode(code);
        return mapToDto(item);
    }

    /**
     * Intelligently finds an item by trying multiple code format variations.
     * Handles:
     * 1. Direct match (exact code or QR code)
     * 2. 14-digit code without "01" prefix → tries with "01" prefix
     * 3. 16-digit code with "01" prefix → tries without "01" prefix
     * 4. QR codes
     *
     * @param code The code/identifier to search for
     * @return Found item or throws ITEM_NOT_FOUND
     */
    private Item findItemBySmartCode(String code) {
        log.debug("Searching for item with smart code: {}", code);

        // Strategy 1: Try direct match first (fastest)
        Optional<Item> item = itemRepository.findByCodeOrQrCode(code);
        if (item.isPresent()) {
            log.debug("Item found by direct match: {}", code);
            return item.get();
        }

        // Strategy 2: Handle 14-digit codes without "01" prefix
        if (code.matches("\\d{14}")) {
            String codeWithPrefix = "01" + code;
            item = itemRepository.findByCodeOrQrCode(codeWithPrefix);
            if (item.isPresent()) {
                log.info("Item found by 14-digit code with added 01 prefix: {} -> {}", code, codeWithPrefix);
                return item.get();
            }
        }

        // Strategy 3: Handle 16-digit codes - try removing "01" prefix
        if (code.matches("\\d{16}")) {
            String codeWithoutPrefix = code.substring(2);
            item = itemRepository.findByCodeOrQrCode(codeWithoutPrefix);
            if (item.isPresent()) {
                log.info("Item found by 16-digit code without 01 prefix: {} -> {}", code, codeWithoutPrefix);
                return item.get();
            }
        }

        // Strategy 4: If 14-digit with 01 prefix was tried, try the 14-digit part
        if (code.matches("01\\d{14}")) {
            String codePart = code.substring(2);
            item = itemRepository.findByCodeOrQrCode(codePart);
            if (item.isPresent()) {
                log.info("Item found by 16-digit code using 14-digit part: {} -> {}", code, codePart);
                return item.get();
            }
        }

        // If all strategies fail, throw not found error
        log.warn("Item not found after trying all code variations: {}", code);
        throw new IllegalArgumentException(InventoryError.ITEM_NOT_FOUND.name());
    }

    @Transactional
    public ItemDto createItem(ItemCreateRequest request, HttpServletRequest httpRequest) {
        rateLimiter.consumeOrThrow(getClientIp(httpRequest), RateLimitOperation.INVENTORY_WRITE);
        Item item = new Item();
        updateItemFromRequest(item, request);
        item.setCode(barcodeService.generateUniqueItemCode());

        String qrCodeToUse = determineQrCode(request.getQrCode(), item.getCode());
        if (qrCodeToUse != null) {
            item.setQrCode(qrCodeToUse);
        }

        return mapToDto(itemRepository.save(item));
    }

    /**
     * Internal method for bulk import - no rate limiting
     */
    @Transactional
    public void createItemInternal(ItemDto dto) {
        Item item = new Item();
        updateItemFromDto(item, dto);

        if (dto.getCode() != null && !dto.getCode().isBlank() && barcodeService.checkUniqueItemCode(dto.getCode())) {
            item.setCode(dto.getCode());
        } else {
            item.setCode(barcodeService.generateUniqueItemCode());
        }

        String qrCodeToUse = determineQrCode(dto.getQrCode(), item.getCode());
        if (qrCodeToUse != null) {
            item.setQrCode(qrCodeToUse);
        }

        mapToDto(itemRepository.save(item));
    }

    /**
     * Determines the QR code to use for an item based on user input and existing data.
     * Logic:
     * 1. If user provides QR code and it's unique → use it
     * 2. If user provides QR code but it exists → generate new one from barcode
     * 3. If user provides barcode format (14 or 16 digits) → generate QR-{barcode}
     * 4. Otherwise → don't set QR code
     */
    private String determineQrCode(String providedQrCode, String itemBarcode) {
        if (providedQrCode == null || providedQrCode.isBlank()) {
            return null;
        }

        // Case 1: User provides QR code format (QR-XXXXX)
        if (providedQrCode.startsWith("QR-")) {
            if (barcodeService.validateQrCode(providedQrCode)) {
                if (!itemRepository.existsByQrCode(providedQrCode)) {
                    // Use provided QR code if unique
                    log.info("Using provided QR code: {}", providedQrCode);
                    return providedQrCode;
                } else {
                    // Generate new QR code from barcode if provided one exists
                    String newQrCode = barcodeService.generateQrCodeFromBarcode(itemBarcode);
                    log.info("QR code {} already exists, generating new: {}", providedQrCode, newQrCode);
                    return newQrCode;
                }
            }
            return null;
        }

        // Case 2: User provides barcode format (14 or 16 digits)
        if (providedQrCode.matches("\\d{14}") || providedQrCode.matches("\\d{16}")) {
            String newQrCode = barcodeService.generateQrCodeFromBarcode(providedQrCode);
            log.info("User provided barcode format, generating QR code: {}", newQrCode);
            return newQrCode;
        }

        // Case 3: Invalid QR code format
        log.warn("Invalid QR code format provided: {}", providedQrCode);
        return null;
    }

    @Transactional
    public ItemDto updateItem(Long id, ItemUpdateRequest request, HttpServletRequest httpRequest) {
        rateLimiter.consumeOrThrow(getClientIp(httpRequest), RateLimitOperation.INVENTORY_WRITE);
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.ITEM_NOT_FOUND.name()));
        updateItemFromRequest(item, request);
        return mapToDto(itemRepository.save(item));
    }

    @Transactional
    public void deleteItem(Long id, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_WRITE);
        if (!itemRepository.existsById(id)) {
            throw new IllegalArgumentException(InventoryError.ITEM_NOT_FOUND.name());
        }
        itemRepository.deleteById(id);
    }

    @Transactional
    public String uploadPhoto(Long id, MultipartFile file, HttpServletRequest request) throws Exception {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_WRITE);
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.ITEM_NOT_FOUND.name()));

        // Walidacja: tylko obrazy są akceptowane
        validateImageFile(file);

        // Read original file bytes
        byte[] originalBytes = file.getBytes();

        // Apply background removal; fall back to original on failure
        byte[] imageBytes = originalBytes;
        byte[] processed = backgroundRemovalService.removeBackground(originalBytes);
        if (processed != null) {
            imageBytes = processed;
            log.debug("Background removed from image for item {}", id);
        } else {
            log.debug("Using original image for item {} (background removal skipped or failed)", id);
        }

        String previousPhoto = item.getPhoto_url();
        String fileName = UUID.randomUUID() + ".enc";

        // Create final reference for use in lambda
        final byte[] finalImageBytes = imageBytes;

        try (PipedInputStream pipedIn = new PipedInputStream(1024 * 64);
             PipedOutputStream pipedOut = new PipedOutputStream(pipedIn)) {

            // Start encryption in background thread using CompletableFuture
            CompletableFuture<Void> encryptionFuture = CompletableFuture.runAsync(
                    () -> encryptToStream(finalImageBytes, pipedOut),
                    asyncTaskExecutor
            );

            try {
                // Upload encrypted stream to storage
                storageService.uploadStream(fileName, pipedIn, "image/png");

                // Wait for encryption to complete (max 30 seconds)
                encryptionFuture.get(30, TimeUnit.SECONDS);
            } catch (InterruptedException ex) {
                // Cancel encryption and restore interrupt status
                encryptionFuture.cancel(true);
                Thread.currentThread().interrupt();
                cleanupFailedUpload(fileName);
                throw ex;
            } catch (ExecutionException ex) {
                // Encryption failed - unwrap and rethrow the actual exception
                cleanupFailedUpload(fileName);
                Throwable cause = ex.getCause();
                if (cause instanceof Exception) {
                    throw (Exception) cause;
                }
                throw ex;
            } catch (TimeoutException ex) {
                log.warn("Encryption thread did not finish within timeout for item {}", id);
                encryptionFuture.cancel(true);
                cleanupFailedUpload(fileName);
                throw new IllegalStateException("Encryption timed out", ex);
            } catch (Exception ex) {
                // Upload failed - cancel encryption and cleanup
                encryptionFuture.cancel(true);
                cleanupFailedUpload(fileName);
                throw ex;
            }
        }

        try {
            item.setPhoto_url(fileName);
            // Image embedding is optional - if model isn't available, photo upload still works
            if (imageEmbeddingService.isModelLoaded()) {
                try {
                    // Use the same processed image bytes - skip redundant background removal
                    item.setImageEmbedding(imageEmbeddingService.getEmbeddingFromProcessedImage(imageBytes));
                } catch (ImageEmbeddingService.ImageEmbeddingException e) {
                    log.warn("Failed to generate image embedding, visual search will not work for this item: {}",
                            e.getMessage());
                }
            } else {
                log.debug("Image embedding model not available, skipping embedding generation");
            }
            itemRepository.save(item);
        } catch (Exception ex) {
            // Compensating transaction: if DB save fails, delete the uploaded file
            cleanupFailedUpload(fileName);
            throw ex;
        }

        if (previousPhoto != null && !previousPhoto.isBlank() && !previousPhoto.equals(fileName)) {
            storageService.delete(previousPhoto);
        }

        return fileName;
    }

    public byte[] downloadPhoto(Long id, HttpServletRequest request) throws Exception {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.ITEM_NOT_FOUND.name()));

        if (item.getPhoto_url() == null) {
            throw new IllegalArgumentException("PHOTO_NOT_FOUND");
        }

        try (InputStream is = storageService.download(item.getPhoto_url());
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            fileCryptoService.decrypt(is, baos);
            return baos.toByteArray();
        }
    }

    private void updateItemFromDto(Item item, ItemDto dto) {
        item.setMin_temp(dto.getMinTemp());
        item.setMax_temp(dto.getMaxTemp());
        item.setWeight(dto.getWeight());
        item.setSize_x(dto.getSizeX());
        item.setSize_y(dto.getSizeY());
        item.setSize_z(dto.getSizeZ());
        item.setComment(dto.getComment());
        item.setExpireAfterDays(dto.getExpireAfterDays());
        item.setDangerous(dto.isDangerous());
        item.setName(dto.getName());

        if (dto.getQrCode() != null && !dto.getQrCode().isBlank()) {
            String qrCodeToUse = determineQrCode(dto.getQrCode(), item.getCode());
            if (qrCodeToUse != null) {
                item.setQrCode(qrCodeToUse);
            }
        }
    }

    private void updateItemFromRequest(Item item, ItemCreateRequest request) {
        item.setMin_temp(request.getMinTemp());
        item.setMax_temp(request.getMaxTemp());
        item.setWeight(request.getWeight());
        item.setSize_x(request.getSizeX());
        item.setSize_y(request.getSizeY());
        item.setSize_z(request.getSizeZ());
        item.setComment(request.getComment());
        item.setExpireAfterDays(request.getExpireAfterDays());
        item.setDangerous(request.isDangerous());
        item.setName(request.getName());

        if (request.getQrCode() != null && !request.getQrCode().isBlank()) {
            String qrCodeToUse = determineQrCode(request.getQrCode(), item.getCode());
            if (qrCodeToUse != null) {
                item.setQrCode(qrCodeToUse);
            }
        }
    }

    private void updateItemFromRequest(Item item, ItemUpdateRequest request) {
        item.setMin_temp(request.getMinTemp());
        item.setMax_temp(request.getMaxTemp());
        item.setWeight(request.getWeight());
        item.setSize_x(request.getSizeX());
        item.setSize_y(request.getSizeY());
        item.setSize_z(request.getSizeZ());
        item.setComment(request.getComment());
        item.setExpireAfterDays(request.getExpireAfterDays());
        item.setDangerous(request.isDangerous());
        item.setName(request.getName());

        if (request.getQrCode() != null && !request.getQrCode().isBlank()) {
            String qrCodeToUse = determineQrCode(request.getQrCode(), item.getCode());
            if (qrCodeToUse != null) {
                item.setQrCode(qrCodeToUse);
            }
        }
    }

    /**
     * Encrypts the given image bytes to the provided output stream.
     * This method runs in a separate thread via CompletableFuture.
     * It properly handles interruptions and ensures CipherOutputStream is finalized.
     *
     * @param imageBytes The image bytes to encrypt
     * @param pipedOut   The output stream to write encrypted data to
     * @throws RuntimeException if encryption fails or thread is interrupted
     */
    private void encryptToStream(byte[] imageBytes, PipedOutputStream pipedOut) {
        try (InputStream rawIn = new ByteArrayInputStream(imageBytes)) {
            // FileCryptoService.encrypt handles CipherOutputStream internally and ensures proper flush/close
            fileCryptoService.encrypt(rawIn, pipedOut);
        } catch (Exception ex) {
            // Check if thread was interrupted during encryption
            if (Thread.currentThread().isInterrupted()) {
                log.debug("Encryption interrupted for item photo upload");
                throw new RuntimeException("Encryption interrupted", ex);
            }
            log.error("Failed to encrypt image", ex);
            throw new RuntimeException("Encryption failed", ex);
        } finally {
            // Ensure PipedOutputStream is closed to signal EOF to the reader
            try {
                pipedOut.close();
            } catch (IOException e) {
                log.debug("Error closing piped output stream", e);
            }
        }
    }

    /**
     * Cleans up a failed upload by deleting the file from storage.
     * Suppresses any exceptions during cleanup to avoid masking the original error.
     *
     * @param fileName The name of the file to delete
     */
    private void cleanupFailedUpload(String fileName) {
        try {
            storageService.delete(fileName);
        } catch (Exception ignored) {
            log.debug("Failed to cleanup file {} after upload failure", fileName);
        }
    }

    /**
     * Walidacja pliku - sprawdza czy to rzeczywiście obraz
     */
    private void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException(InventoryError.FILE_IS_EMPTY.name());
        }

        // Sprawdź Content-Type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException(InventoryError.INVALID_FILE_TYPE.name());
        }

        // Lista dozwolonych typów MIME
        List<String> allowedTypes = List.of(
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/gif",
                "image/webp",
                "image/bmp"
        );

        if (!allowedTypes.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException(InventoryError.UNSUPPORTED_IMAGE_TYPE.name());
        }

        // Sprawdź rozszerzenie pliku
        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null) {
            String extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
            List<String> allowedExtensions = List.of("jpg", "jpeg", "png", "gif", "webp", "bmp");

            if (!allowedExtensions.contains(extension)) {
                throw new IllegalArgumentException(InventoryError.INVALID_FILE_EXTENSION.name());
            }
        }

        // Sprawdź maksymalny rozmiar (np. 10MB)
        long maxSize = 10 * 1024 * 1024; // 10MB
        if (file.getSize() > maxSize) {
            throw new IllegalArgumentException(InventoryError.FILE_TOO_LARGE.name());
        }
    }

    private ItemDto mapToDto(Item item) {
        return ItemDto.builder()
                .id(item.getId())
                .code(item.getCode())
                .minTemp(item.getMin_temp())
                .maxTemp(item.getMax_temp())
                .weight(item.getWeight())
                .sizeX(item.getSize_x())
                .sizeY(item.getSize_y())
                .sizeZ(item.getSize_z())
                .comment(item.getComment())
                .expireAfterDays(item.getExpireAfterDays())
                .isDangerous(item.isDangerous())
                .name(item.getName())
                .build();
    }
}
