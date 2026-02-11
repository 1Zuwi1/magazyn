package com.github.dawid_stolarczyk.magazyn.Services.Inventory;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ItemCreateRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ItemDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ItemUpdateRequest;
import com.github.dawid_stolarczyk.magazyn.Crypto.FileCryptoService;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Item;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.ItemImageRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.ItemRepository;
import com.github.dawid_stolarczyk.magazyn.Services.Ai.BackgroundRemovalService;
import com.github.dawid_stolarczyk.magazyn.Services.Ai.ImageEmbeddingService;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import com.github.dawid_stolarczyk.magazyn.Services.Storage.StorageService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.task.AsyncTaskExecutor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ItemServiceTest {

    @Mock
    private ItemRepository itemRepository;
    @Mock
    private ItemImageRepository itemImageRepository;
    @Mock
    private FileCryptoService fileCryptoService;
    @Mock
    private StorageService storageService;
    @Mock
    private BarcodeService barcodeService;
    @Mock
    private Bucket4jRateLimiter rateLimiter;
    @Mock
    private SmartCodeService smartCodeService;
    @Mock
    private ImageEmbeddingService imageEmbeddingService;
    @Mock
    private BackgroundRemovalService backgroundRemovalService;
    @Mock
    private AsyncTaskExecutor asyncTaskExecutor;
    @Mock
    private HttpServletRequest httpRequest;

    @InjectMocks
    private ItemService itemService;

    private Item sampleItem;

    @BeforeEach
    void setUp() {
        when(httpRequest.getRemoteAddr()).thenReturn("127.0.0.1");

        sampleItem = new Item();
        sampleItem.setId(1L);
        sampleItem.setName("Test Item");
        sampleItem.setCode("0112345678901234");
        sampleItem.setQrCode("QR-0112345678901234");
        sampleItem.setWeight(2.5f);
        sampleItem.setMin_temp(0f);
        sampleItem.setMax_temp(25f);
        sampleItem.setSize_x(100f);
        sampleItem.setSize_y(200f);
        sampleItem.setSize_z(300f);
        sampleItem.setDangerous(false);
        sampleItem.setImages(new ArrayList<>());
    }

    // ── createItem ───────────────────────────────────────────────────

    @Nested
    @DisplayName("createItem")
    class CreateItem {

        @Test
        void should_CreateItem_When_ValidRequest() {
            // Given
            ItemCreateRequest request = ItemCreateRequest.builder()
                    .name("New Item")
                    .minTemp(0f).maxTemp(25f)
                    .weight(1.5f)
                    .sizeX(100f).sizeY(200f).sizeZ(300f)
                    .dangerous(false)
                    .expireAfterDays(30)
                    .build();

            when(barcodeService.generateUniqueItemCode()).thenReturn("0198765432101234");
            when(barcodeService.generateQrCodeFromBarcode("0198765432101234")).thenReturn("QR-0198765432101234");
            when(itemRepository.save(any(Item.class))).thenAnswer(inv -> {
                Item saved = inv.getArgument(0);
                saved.setId(1L);
                return saved;
            });

            // When
            ItemDto result = itemService.createItem(request, httpRequest);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getName()).isEqualTo("New Item");
            assertThat(result.getCode()).isEqualTo("0198765432101234");
            verify(itemRepository).save(any(Item.class));
            verify(barcodeService).generateUniqueItemCode();
        }

        @Test
        void should_GenerateBarcode_When_ItemCreated() {
            // Given
            ItemCreateRequest request = ItemCreateRequest.builder()
                    .name("Auto-code Item")
                    .weight(0.5f)
                    .build();

            when(barcodeService.generateUniqueItemCode()).thenReturn("0199887766554433");
            when(barcodeService.generateQrCodeFromBarcode(anyString())).thenReturn("QR-0199887766554433");
            when(itemRepository.save(any(Item.class))).thenAnswer(inv -> {
                Item saved = inv.getArgument(0);
                saved.setId(2L);
                return saved;
            });

            // When
            ItemDto result = itemService.createItem(request, httpRequest);

            // Then
            assertThat(result.getCode()).startsWith("01");
            verify(barcodeService).generateUniqueItemCode();
        }
    }

    // ── getItemById ──────────────────────────────────────────────────

    @Nested
    @DisplayName("getItemById")
    class GetItemById {

        @Test
        void should_ReturnItem_When_FoundById() {
            // Given
            when(itemRepository.findById(1L)).thenReturn(Optional.of(sampleItem));

            // When
            ItemDto result = itemService.getItemById(1L, httpRequest);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(1L);
            assertThat(result.getName()).isEqualTo("Test Item");
        }

        @Test
        void should_ThrowException_When_ItemNotFoundById() {
            // Given
            when(itemRepository.findById(999L)).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> itemService.getItemById(999L, httpRequest))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("ITEM_NOT_FOUND");
        }
    }

    // ── getItemByCode ────────────────────────────────────────────────

    @Nested
    @DisplayName("getItemByCode")
    class GetItemByCode {

        @Test
        void should_ReturnItemByCode_When_Found() {
            // Given
            when(itemRepository.findByCodeOrQrCode("0112345678901234")).thenReturn(Optional.of(sampleItem));

            // When
            ItemDto result = itemService.getItemByCode("0112345678901234", httpRequest);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getCode()).isEqualTo("0112345678901234");
        }

        @Test
        void should_ThrowException_When_ItemNotFoundByCode() {
            // Given
            when(itemRepository.findByCodeOrQrCode("unknown")).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> itemService.getItemByCode("unknown", httpRequest))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("ITEM_NOT_FOUND");
        }
    }

    // ── updateItem ───────────────────────────────────────────────────

    @Nested
    @DisplayName("updateItem")
    class UpdateItem {

        @Test
        void should_UpdateItem_When_ValidRequest() {
            // Given
            when(itemRepository.findById(1L)).thenReturn(Optional.of(sampleItem));
            when(itemRepository.save(any(Item.class))).thenReturn(sampleItem);

            ItemUpdateRequest request = ItemUpdateRequest.builder()
                    .name("Updated Item")
                    .minTemp(5f).maxTemp(30f)
                    .weight(3.0f)
                    .build();

            // When
            ItemDto result = itemService.updateItem(1L, request, httpRequest);

            // Then
            assertThat(result).isNotNull();
            verify(itemRepository).findById(1L);
            verify(itemRepository).save(sampleItem);
        }

        @Test
        void should_ThrowException_When_UpdateNonExistentItem() {
            // Given
            when(itemRepository.findById(999L)).thenReturn(Optional.empty());

            ItemUpdateRequest request = ItemUpdateRequest.builder().name("X").build();

            // When / Then
            assertThatThrownBy(() -> itemService.updateItem(999L, request, httpRequest))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("ITEM_NOT_FOUND");
        }
    }

    // ── deleteItem ───────────────────────────────────────────────────

    @Nested
    @DisplayName("deleteItem")
    class DeleteItem {

        @Test
        void should_DeleteItem_When_Exists() {
            // Given
            when(itemRepository.existsById(1L)).thenReturn(true);

            // When
            itemService.deleteItem(1L, httpRequest);

            // Then
            verify(itemRepository).deleteById(1L);
        }

        @Test
        void should_ThrowException_When_DeleteNonExistentItem() {
            // Given
            when(itemRepository.existsById(999L)).thenReturn(false);

            // When / Then
            assertThatThrownBy(() -> itemService.deleteItem(999L, httpRequest))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("ITEM_NOT_FOUND");
        }
    }

    // ── uploadMultiplePhotos ─────────────────────────────────────────

    @Nested
    @DisplayName("uploadMultiplePhotos")
    class UploadMultiplePhotos {

        @Test
        void should_ThrowException_When_ItemNotFoundForUpload() {
            // Given
            List<MultipartFile> files = List.of(
                    new MockMultipartFile("file", "photo.jpg", "image/jpeg", new byte[] { 1, 2, 3 }));
            when(itemRepository.findById(999L)).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> itemService.uploadMultiplePhotos(999L, files, httpRequest))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("ITEM_NOT_FOUND");
        }

        @Test
        void should_ThrowException_When_MaxImagesExceeded() {
            // Given
            when(itemRepository.findById(1L)).thenReturn(Optional.of(sampleItem));
            when(itemImageRepository.countByItemId(1L)).thenReturn(10); // already at max

            List<MultipartFile> files = List.of(
                    new MockMultipartFile("file", "photo.jpg", "image/jpeg", new byte[]{1, 2, 3})
            );

            // When / Then
            assertThatThrownBy(() -> itemService.uploadMultiplePhotos(1L, files, httpRequest))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("MAX_IMAGES_EXCEEDED");
        }

        @Test
        void should_ThrowException_When_FileListIsEmpty() {
            // Given
            when(itemRepository.findById(1L)).thenReturn(Optional.of(sampleItem));

            // When / Then — null files
            assertThatThrownBy(() -> itemService.uploadMultiplePhotos(1L, null, httpRequest))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("FILE_IS_EMPTY");

            // When / Then — empty list
            assertThatThrownBy(() -> itemService.uploadMultiplePhotos(1L, List.of(), httpRequest))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("FILE_IS_EMPTY");
        }
    }

    // ── getAllItemsPaged ──────────────────────────────────────────────

    @Nested
    @DisplayName("getAllItemsPaged")
    class GetAllItemsPaged {

        @Test
        @SuppressWarnings("unchecked")
        void should_ReturnPagedItems_When_Filtered() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);
            Page<Item> itemPage = new PageImpl<>(List.of(sampleItem), pageable, 1);

            when(itemRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(itemPage);

            // When
            Page<ItemDto> result = itemService.getAllItemsPaged(
                    httpRequest, pageable, null, null, null, null, null, null, null, null, null, null);

            // Then
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getName()).isEqualTo("Test Item");
        }
    }
}
