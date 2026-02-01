package com.github.dawid_stolarczyk.magazyn.Services.Inventory;

import com.github.dawid_stolarczyk.magazyn.Common.Enums.InventoryError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ItemDto;
import com.github.dawid_stolarczyk.magazyn.Crypto.FileCryptoService;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Item;
import com.github.dawid_stolarczyk.magazyn.Repositories.ItemRepository;
import com.github.dawid_stolarczyk.magazyn.Services.Storage.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ItemService {
    private final ItemRepository itemRepository;
    private final FileCryptoService fileCryptoService;
    private final StorageService storageService;
    private final BarcodeService barcodeService;

    public List<ItemDto> getAllItems() {
        return itemRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public ItemDto getItemById(Long id) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.ITEM_NOT_FOUND.name()));
        return mapToDto(item);
    }

    @Transactional
    public ItemDto createItem(ItemDto dto) {
        Item item = new Item();
        updateItemFromDto(item, dto);
        item.setBarcode(barcodeService.generateUniqueItemBarcode());
        return mapToDto(itemRepository.save(item));
    }

    @Transactional
    public ItemDto updateItem(Long id, ItemDto dto) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.ITEM_NOT_FOUND.name()));
        updateItemFromDto(item, dto);
        return mapToDto(itemRepository.save(item));
    }

    @Transactional
    public void deleteItem(Long id) {
        if (!itemRepository.existsById(id)) {
            throw new IllegalArgumentException(InventoryError.ITEM_NOT_FOUND.name());
        }
        itemRepository.deleteById(id);
    }

    @Transactional
    public String uploadPhoto(Long id, MultipartFile file) throws Exception {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.ITEM_NOT_FOUND.name()));

        String previousPhoto = item.getPhoto_url();
        String fileName = UUID.randomUUID() + ".enc";
        AtomicReference<Exception> encryptionError = new AtomicReference<>();

        try (PipedInputStream pipedIn = new PipedInputStream(1024 * 64);
             PipedOutputStream pipedOut = new PipedOutputStream(pipedIn);
             InputStream rawIn = file.getInputStream()) {

            Thread encryptThread = new Thread(() -> {
                try (PipedOutputStream out = pipedOut; InputStream in = rawIn) {
                    fileCryptoService.encrypt(in, out);
                } catch (Exception ex) {
                    encryptionError.set(ex);
                    try {
                        pipedIn.close();
                    } catch (IOException ignored) {
                        // noop
                    }
                }
            }, "item-photo-encrypt");

            encryptThread.start();

            storageService.uploadStream(fileName, pipedIn, file.getContentType());

            encryptThread.join();
            if (encryptionError.get() != null) {
                throw encryptionError.get();
            }
        }

        item.setPhoto_url(fileName);
        itemRepository.save(item);

        if (previousPhoto != null && !previousPhoto.isBlank() && !previousPhoto.equals(fileName)) {
            storageService.delete(previousPhoto);
        }

        return fileName;
    }

    public byte[] downloadPhoto(Long id) throws Exception {
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

    private ItemDto mapToDto(Item item) {
        return ItemDto.builder()
                .id(item.getId())
                .barcode(item.getBarcode())
                .photoUrl(item.getPhoto_url() != null ? "/api/items/" + item.getId() + "/photo" : null)
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
