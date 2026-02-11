package com.github.dawid_stolarczyk.magazyn.Services.Inventory;

import com.github.dawid_stolarczyk.magazyn.Common.Enums.InventoryError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ItemCreateRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ItemDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ItemImageDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ItemUpdateRequest;
import com.github.dawid_stolarczyk.magazyn.Crypto.FileCryptoService;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Item;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.ItemImage;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.ItemImageRepository;
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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.task.AsyncTaskExecutor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.util.ArrayList;
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
    private final ItemImageRepository itemImageRepository;
    private final FileCryptoService fileCryptoService;
    private final StorageService storageService;
    private final BarcodeService barcodeService;
    private final Bucket4jRateLimiter rateLimiter;
    private final SmartCodeService smartCodeService;
    private final ImageEmbeddingService imageEmbeddingService;
    private final BackgroundRemovalService backgroundRemovalService;
    @Qualifier("asyncTaskExecutor")
    private final AsyncTaskExecutor asyncTaskExecutor;

    @Value("${app.item-images.max-per-item:10}")
    private int maxImagesPerItem;

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

    public boolean existsByPhotoUrl(String photoUrl) {
        if (photoUrl == null || photoUrl.isBlank()) {
            return false;
        }
        return itemRepository.existsByPhotoUrl(photoUrl);
    }

    private Item findItemBySmartCode(String code) {
        log.debug("Searching for item with smart code: {}", code);

        Optional<Item> item = itemRepository.findByCodeOrQrCode(code);
        if (item.isPresent()) {
            log.debug("Item found by direct match: {}", code);
            return item.get();
        }

        if (code.matches("\\d{14}")) {
            String codeWithPrefix = "01" + code;
            item = itemRepository.findByCodeOrQrCode(codeWithPrefix);
            if (item.isPresent()) {
                log.info("Item found by 14-digit code with added 01 prefix: {} -> {}", code, codeWithPrefix);
                return item.get();
            }
        }

        if (code.matches("\\d{16}")) {
            String codeWithoutPrefix = code.substring(2);
            item = itemRepository.findByCodeOrQrCode(codeWithoutPrefix);
            if (item.isPresent()) {
                log.info("Item found by 16-digit code without 01 prefix: {} -> {}", code, codeWithoutPrefix);
                return item.get();
            }
        }

        if (code.matches("01\\d{14}")) {
            String codePart = code.substring(2);
            item = itemRepository.findByCodeOrQrCode(codePart);
            if (item.isPresent()) {
                log.info("Item found by 16-digit code using 14-digit part: {} -> {}", code, codePart);
                return item.get();
            }
        }

        log.warn("Item not found after trying all code variations: {}", code);
        throw new IllegalArgumentException(InventoryError.ITEM_NOT_FOUND.name());
    }

    @Transactional
    public ItemDto createItem(ItemCreateRequest request, HttpServletRequest httpRequest) {
        rateLimiter.consumeOrThrow(getClientIp(httpRequest), RateLimitOperation.INVENTORY_WRITE);
        Item item = new Item();
        updateItemFromRequest(item, request);
        item.setCode(barcodeService.generateUniqueItemCode());
        item.setQrCode(determineQrCode(request.getQrCode(), item.getCode()));

        return mapToDto(itemRepository.save(item));
    }

    @Transactional
    public void createItemInternal(ItemDto dto) {
        Item item = new Item();
        updateItemFromDto(item, dto);

        if (dto.getCode() != null && !dto.getCode().isBlank() && barcodeService.checkUniqueItemCode(dto.getCode())) {
            item.setCode(dto.getCode());
        } else {
            item.setCode(barcodeService.generateUniqueItemCode());
        }

        item.setQrCode(determineQrCode(dto.getQrCode(), item.getCode()));

        if (dto.getPhotoUrl() != null && !dto.getPhotoUrl().isBlank()) {
            item.setPhoto_url(dto.getPhotoUrl());
            item.setImageUploaded(false);
        }

        mapToDto(itemRepository.save(item));
    }

    private String determineQrCode(String providedQrCode, String itemBarcode) {
        if (providedQrCode == null || providedQrCode.isBlank()) {
            return generateDefaultQrCode(itemBarcode);
        }

        if (providedQrCode.startsWith("QR-")) {
            if (barcodeService.validateQrCode(providedQrCode)) {
                if (!itemRepository.existsByQrCode(providedQrCode)) {
                    log.info("Using provided QR code: {}", providedQrCode);
                    return providedQrCode;
                } else {
                    String newQrCode = generateDefaultQrCode(itemBarcode);
                    log.info("QR code {} already exists, generating new: {}", providedQrCode, newQrCode);
                    return newQrCode;
                }
            }
            return generateDefaultQrCode(itemBarcode);
        }

        if (providedQrCode.matches("\\d{14}") || providedQrCode.matches("\\d{16}")) {
            String newQrCode = barcodeService.generateQrCodeFromBarcode(providedQrCode);
            log.info("User provided barcode format, generating QR code: {}", newQrCode);
            return newQrCode;
        }

        log.warn("Invalid QR code format provided: {}, using default QR code", providedQrCode);
        return generateDefaultQrCode(itemBarcode);
    }

    private String generateDefaultQrCode(String itemBarcode) {
        return barcodeService.generateQrCodeFromBarcode(itemBarcode);
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

    /**
     * Uploads multiple photos for an item.
     */
    @Transactional
    public List<ItemImageDto> uploadMultiplePhotos(Long id, List<MultipartFile> files, HttpServletRequest request) throws Exception {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_WRITE);
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.ITEM_NOT_FOUND.name()));

        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException(InventoryError.FILE_IS_EMPTY.name());
        }

        int currentCount = itemImageRepository.countByItemId(id);
        int slotsAvailable = maxImagesPerItem - currentCount;

        if (files.size() > slotsAvailable) {
            throw new IllegalArgumentException(InventoryError.MAX_IMAGES_EXCEEDED.name());
        }

        List<ItemImageDto> results = new ArrayList<>();

        for (MultipartFile file : files) {
            validateImageFile(file);

            byte[] imageBytes = processImage(file);
            String fileName = encryptAndUpload(imageBytes, id);

            float[] embedding = generateEmbedding(imageBytes);
            boolean shouldBePrimary = currentCount == 0;
            int displayOrder = itemImageRepository.getNextDisplayOrder(id);

            try {
                if (shouldBePrimary) {
                    itemImageRepository.clearPrimaryForItem(id);
                }

                ItemImage newImage = ItemImage.builder()
                        .item(item)
                        .photoUrl(fileName)
                        .imageEmbedding(embedding)
                        .isPrimary(shouldBePrimary)
                        .displayOrder(displayOrder)
                        .build();
                newImage = itemImageRepository.save(newImage);

                // If this is the first image, update denormalized fields
                if (shouldBePrimary) {
                    item.setPhoto_url(fileName);
                    item.setImageUploaded(true);
                    itemRepository.save(item);
                }

                results.add(mapToImageDto(newImage));
                currentCount++;
            } catch (Exception ex) {
                cleanupFailedUpload(fileName);
                throw ex;
            }
        }

        return results;
    }

    /**
     * Deletes a specific photo from an item's gallery.
     * If the deleted image was primary, auto-promotes the next image.
     */
    @Transactional
    public void deletePhoto(Long itemId, Long imageId, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_WRITE);
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.ITEM_NOT_FOUND.name()));

        ItemImage image = itemImageRepository.findById(imageId)
                .filter(img -> img.getItem().getId().equals(itemId))
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.IMAGE_NOT_FOUND.name()));

        String photoUrl = image.getPhotoUrl();
        boolean wasPrimary = image.isPrimary();

        itemImageRepository.delete(image);
        itemImageRepository.flush();

        // Cleanup storage
        if (photoUrl != null && !photoUrl.isBlank()) {
            try {
                storageService.delete(photoUrl);
            } catch (Exception e) {
                log.warn("Failed to delete photo from storage: {}", photoUrl);
            }
        }

        if (wasPrimary) {
            // Auto-promote next image by displayOrder
            List<ItemImage> remaining = itemImageRepository.findByItemIdOrderByDisplayOrderAsc(itemId);
            if (!remaining.isEmpty()) {
                ItemImage newPrimary = remaining.get(0);
                newPrimary.setPrimary(true);
                itemImageRepository.save(newPrimary);
                item.setPhoto_url(newPrimary.getPhotoUrl());
                itemRepository.save(item);
            } else {
                // No images left
                item.setPhoto_url(null);
                item.setImageUploaded(false);
                itemRepository.save(item);
            }
        }
    }

    /**
     * Sets a specific image as the primary image for an item.
     */
    @Transactional
    public void setPrimaryPhoto(Long itemId, Long imageId, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_WRITE);
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.ITEM_NOT_FOUND.name()));

        ItemImage image = itemImageRepository.findById(imageId)
                .filter(img -> img.getItem().getId().equals(itemId))
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.IMAGE_NOT_FOUND.name()));

        itemImageRepository.clearPrimaryForItem(itemId);
        image.setPrimary(true);
        itemImageRepository.save(image);

        // Update denormalized photo_url on item
        item.setPhoto_url(image.getPhotoUrl());
        itemRepository.save(item);
    }

    /**
     * Returns all photos for an item.
     */
    public List<ItemImageDto> getItemPhotos(Long itemId, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);
        if (!itemRepository.existsById(itemId)) {
            throw new IllegalArgumentException(InventoryError.ITEM_NOT_FOUND.name());
        }
        return itemImageRepository.findByItemIdOrderByDisplayOrderAsc(itemId).stream()
                .map(this::mapToImageDto)
                .toList();
    }

    /**
     * Downloads a specific photo by image ID.
     */
    public byte[] downloadPhotoByImageId(Long itemId, Long imageId, HttpServletRequest request) throws Exception {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);
        ItemImage image = itemImageRepository.findById(imageId)
                .filter(img -> img.getItem().getId().equals(itemId))
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.IMAGE_NOT_FOUND.name()));

        try (InputStream is = storageService.download(image.getPhotoUrl());
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            fileCryptoService.decrypt(is, baos);
            return baos.toByteArray();
        }
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

    @Transactional
    public List<String> uploadPhotosBatch(List<MultipartFile> files) throws Exception {
        List<String> results = new ArrayList<>();

        for (MultipartFile file : files) {
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || originalFilename.isBlank()) {
                results.add("SKIPPED: No filename");
                continue;
            }

            validateImageFile(file);

            Optional<Item> itemOpt = itemRepository.findByPhoto_url(originalFilename);
            if (itemOpt.isEmpty()) {
                results.add("NOT_FOUND: " + originalFilename);
                continue;
            }

            Item item = itemOpt.get();

            byte[] imageBytes = processImage(file);
            String fileName = UUID.randomUUID() + ".enc";

            final byte[] finalImageBytes = imageBytes;

            try (PipedInputStream pipedIn = new PipedInputStream(1024 * 64);
                 PipedOutputStream pipedOut = new PipedOutputStream(pipedIn)) {

                CompletableFuture<Void> encryptionFuture = CompletableFuture.runAsync(
                        () -> encryptToStream(finalImageBytes, pipedOut),
                        asyncTaskExecutor
                );

                try {
                    storageService.uploadStream(fileName, pipedIn, "image/png");
                    encryptionFuture.get(30, TimeUnit.SECONDS);
                } catch (Exception ex) {
                    encryptionFuture.cancel(true);
                    cleanupFailedUpload(fileName);
                    results.add("FAILED: " + originalFilename + " - " + ex.getMessage());
                    continue;
                }
            }

            try {
                float[] embedding = generateEmbedding(imageBytes);

                // Create primary ItemImage for this item
                ItemImage newImage = ItemImage.builder()
                        .item(item)
                        .photoUrl(fileName)
                        .imageEmbedding(embedding)
                        .isPrimary(true)
                        .displayOrder(0)
                        .build();
                itemImageRepository.save(newImage);

                item.setPhoto_url(fileName);
                item.setImageUploaded(true);
                itemRepository.save(item);
                results.add("UPLOADED: " + originalFilename + " -> item_id=" + item.getId());
            } catch (Exception ex) {
                cleanupFailedUpload(fileName);
                results.add("DB_FAILED: " + originalFilename + " - " + ex.getMessage());
            }
        }

        return results;
    }

    // === Helper methods ===

    private byte[] processImage(MultipartFile file) throws IOException {
        byte[] originalBytes = file.getBytes();
        byte[] processed = backgroundRemovalService.removeBackground(originalBytes);
        if (processed != null) {
            return processed;
        }
        return originalBytes;
    }

    private String encryptAndUpload(byte[] imageBytes, Long itemId) throws Exception {
        String fileName = UUID.randomUUID() + ".enc";

        try (PipedInputStream pipedIn = new PipedInputStream(1024 * 64);
             PipedOutputStream pipedOut = new PipedOutputStream(pipedIn)) {

            CompletableFuture<Void> encryptionFuture = CompletableFuture.runAsync(
                    () -> encryptToStream(imageBytes, pipedOut),
                    asyncTaskExecutor
            );

            try {
                storageService.uploadStream(fileName, pipedIn, "image/png");
                encryptionFuture.get(30, TimeUnit.SECONDS);
            } catch (InterruptedException ex) {
                encryptionFuture.cancel(true);
                Thread.currentThread().interrupt();
                cleanupFailedUpload(fileName);
                throw ex;
            } catch (ExecutionException ex) {
                cleanupFailedUpload(fileName);
                Throwable cause = ex.getCause();
                if (cause instanceof Exception) {
                    throw (Exception) cause;
                }
                throw ex;
            } catch (TimeoutException ex) {
                log.warn("Encryption thread did not finish within timeout for item {}", itemId);
                encryptionFuture.cancel(true);
                cleanupFailedUpload(fileName);
                throw new IllegalStateException("Encryption timed out", ex);
            } catch (Exception ex) {
                encryptionFuture.cancel(true);
                cleanupFailedUpload(fileName);
                throw ex;
            }
        }

        return fileName;
    }

    private float[] generateEmbedding(byte[] imageBytes) {
        if (imageEmbeddingService.isModelLoaded()) {
            try {
                return imageEmbeddingService.getEmbeddingFromProcessedImage(imageBytes);
            } catch (ImageEmbeddingService.ImageEmbeddingException e) {
                log.warn("Failed to generate image embedding: {}", e.getMessage());
            }
        } else {
            log.debug("Image embedding model not available, skipping embedding generation");
        }
        return null;
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
        item.setImageUploaded(dto.isImageUploaded());

        if (dto.getQrCode() != null && !dto.getQrCode().isBlank()) {
            item.setQrCode(determineQrCode(dto.getQrCode(), item.getCode()));
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
            item.setQrCode(determineQrCode(request.getQrCode(), item.getCode()));
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
            item.setQrCode(determineQrCode(request.getQrCode(), item.getCode()));
        }
    }

    private void encryptToStream(byte[] imageBytes, PipedOutputStream pipedOut) {
        try (InputStream rawIn = new ByteArrayInputStream(imageBytes)) {
            fileCryptoService.encrypt(rawIn, pipedOut);
        } catch (Exception ex) {
            if (Thread.currentThread().isInterrupted()) {
                log.debug("Encryption interrupted for item photo upload");
                throw new RuntimeException("Encryption interrupted", ex);
            }
            log.error("Failed to encrypt image", ex);
            throw new RuntimeException("Encryption failed", ex);
        } finally {
            try {
                pipedOut.close();
            } catch (IOException e) {
                log.debug("Error closing piped output stream", e);
            }
        }
    }

    private void cleanupFailedUpload(String fileName) {
        try {
            storageService.delete(fileName);
        } catch (Exception ignored) {
            log.debug("Failed to cleanup file {} after upload failure", fileName);
        }
    }

    private void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException(InventoryError.FILE_IS_EMPTY.name());
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException(InventoryError.INVALID_FILE_TYPE.name());
        }

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

        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null) {
            String extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
            List<String> allowedExtensions = List.of("jpg", "jpeg", "png", "gif", "webp", "bmp");

            if (!allowedExtensions.contains(extension)) {
                throw new IllegalArgumentException(InventoryError.INVALID_FILE_EXTENSION.name());
            }
        }

        long maxSize = 10 * 1024 * 1024; // 10MB
        if (file.getSize() > maxSize) {
            throw new IllegalArgumentException(InventoryError.FILE_TOO_LARGE.name());
        }
    }

    private ItemDto mapToDto(Item item) {
        List<ItemImageDto> imageDtos = null;
        int imageCount = 0;
        if (item.getImages() != null) {
            imageCount = item.getImages().size();
            imageDtos = item.getImages().stream()
                    .map(this::mapToImageDto)
                    .toList();
        }

        return ItemDto.builder()
                .id(item.getId())
                .code(item.getCode())
                .qrCode(item.getQrCode())
                .photoUrl(item.getPhoto_url())
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
                .imageUploaded(item.isImageUploaded())
                .imageCount(imageCount)
                .images(imageDtos)
                .build();
    }

    private ItemImageDto mapToImageDto(ItemImage image) {
        return ItemImageDto.builder()
                .id(image.getId())
                .itemId(image.getItem().getId())
                .photoUrl(image.getPhotoUrl())
                .isPrimary(image.isPrimary())
                .displayOrder(image.getDisplayOrder())
                .hasEmbedding(image.getImageEmbedding() != null)
                .createdAt(image.getCreatedAt())
                .build();
    }
}
