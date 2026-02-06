package com.github.dawid_stolarczyk.magazyn.Services.Inventory;

import com.github.dawid_stolarczyk.magazyn.Common.Enums.InventoryError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ItemCreateRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ItemDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ItemUpdateRequest;
import com.github.dawid_stolarczyk.magazyn.Crypto.FileCryptoService;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Item;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.ItemRepository;
import com.github.dawid_stolarczyk.magazyn.Services.Ai.ImageEmbeddingService;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.RateLimitOperation;
import com.github.dawid_stolarczyk.magazyn.Services.Storage.StorageService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

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
    private final ImageEmbeddingService imageEmbeddingService;

    public List<ItemDto> getAllItems(HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);
        return itemRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public Page<ItemDto> getAllItemsPaged(HttpServletRequest request, Pageable pageable) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);
        return itemRepository.findAll(pageable)
                .map(this::mapToDto);
    }

    public ItemDto getItemById(Long id, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.ITEM_NOT_FOUND.name()));
        return mapToDto(item);
    }

    public ItemDto getItemByCode(String code, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);
        Item item = itemRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.ITEM_NOT_FOUND.name()));
        return mapToDto(item);
    }

    @Transactional
    public ItemDto createItem(ItemCreateRequest request, HttpServletRequest httpRequest) {
        rateLimiter.consumeOrThrow(getClientIp(httpRequest), RateLimitOperation.INVENTORY_WRITE);
        Item item = new Item();
        updateItemFromRequest(item, request);
        item.setCode(barcodeService.generateUniqueItemCode());
        return mapToDto(itemRepository.save(item));
    }

    /**
     * Internal method for bulk import - no rate limiting
     */
    @Transactional
    public void createItemInternal(ItemDto dto) {
        Item item = new Item();
        updateItemFromDto(item, dto);
        if (dto.getCode() != null && !dto.getCode().isBlank()) {
            item.setCode(dto.getCode());
        }
        item.setCode(barcodeService.generateUniqueItemCode());
        mapToDto(itemRepository.save(item));
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

        String previousPhoto = item.getPhoto_url();
        String fileName = UUID.randomUUID() + ".enc";
        AtomicReference<Exception> encryptionError = new AtomicReference<>();
        java.util.concurrent.CountDownLatch encryptionStarted = new java.util.concurrent.CountDownLatch(1);
        java.util.concurrent.CountDownLatch encryptionFinished = new java.util.concurrent.CountDownLatch(1);

        try (PipedInputStream pipedIn = new PipedInputStream(1024 * 64);
             PipedOutputStream pipedOut = new PipedOutputStream(pipedIn)) {

            Thread encryptThread = new Thread(() -> {
                try (InputStream rawIn = file.getInputStream()) {
                    encryptionStarted.countDown();
                    fileCryptoService.encrypt(rawIn, pipedOut);
                } catch (Exception ex) {
                    encryptionError.set(ex);
                    try {
                        pipedIn.close();
                    } catch (IOException ignored) {
                    }
                } finally {
                    encryptionFinished.countDown();
                    try {
                        pipedOut.close();
                    } catch (IOException ignored) {
                    }
                }
            }, "item-photo-encrypt");

            encryptThread.setDaemon(false);
            encryptThread.start();

            try {
                // Czekaj na start szyfrowania (max 5 sekund)
                if (!encryptionStarted.await(5, java.util.concurrent.TimeUnit.SECONDS)) {
                    throw new IllegalStateException("Encryption thread failed to start");
                }

                // Sprawdź czy nie było błędu podczas startu
                if (encryptionError.get() != null) {
                    throw encryptionError.get();
                }

                storageService.uploadStream(fileName, pipedIn, file.getContentType());
            } catch (Exception ex) {
                // Jeśli upload się nie uda, przerwij szyfrowanie i posprzątaj
                encryptThread.interrupt();
                try {
                    pipedIn.close();
                } catch (IOException ignored) {
                }
                try {
                    storageService.delete(fileName);
                } catch (Exception ignored) {
                }
                throw ex;
            } finally {
                // Poczekaj na zakończenie szyfrowania (max 30 sekund)
                if (!encryptionFinished.await(30, java.util.concurrent.TimeUnit.SECONDS)) {
                    log.warn("Encryption thread did not finish within timeout for item {}", id);
                    encryptThread.interrupt();
                }
            }

            // Sprawdź czy podczas szyfrowania wystąpił błąd
            if (encryptionError.get() != null) {
                try {
                    storageService.delete(fileName);
                } catch (Exception ignored) {
                }
                throw encryptionError.get();
            }
        }

        try {
            item.setPhoto_url(fileName);
            // Image embedding is optional - if model isn't available, photo upload still works
            if (imageEmbeddingService.isModelLoaded()) {
                try {
                    item.setImageEmbedding(imageEmbeddingService.getEmbedding(file));
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
            try {
                storageService.delete(fileName);
            } catch (Exception ignored) {
            }
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
        // Name is optional - only set if provided
        if (request.getName() != null && !request.getName().isBlank()) {
            item.setName(request.getName());
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
        // Name is optional - only update if provided
        if (request.getName() != null && !request.getName().isBlank()) {
            item.setName(request.getName());
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
