package com.github.dawid_stolarczyk.magazyn.Services.Inventory;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.Item;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.AssortmentRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.ItemRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BarcodeServiceTest {

    @Mock
    private ItemRepository itemRepository;

    @Mock
    private AssortmentRepository assortmentRepository;

    @InjectMocks
    private BarcodeService barcodeService;

    // ── generateUniqueItemCode ───────────────────────────────────────

    @Nested
    @DisplayName("generateUniqueItemCode")
    class GenerateUniqueItemCode {

        @Test
        void should_GenerateUnique16DigitCode_When_Called() {
            // Given
            when(itemRepository.existsByCode(anyString())).thenReturn(false);

            // When
            String code = barcodeService.generateUniqueItemCode();

            // Then
            assertThat(code)
                    .hasSize(16)
                    .startsWith("01")
                    .matches("\\d{16}");
        }

        @Test
        void should_RetryGeneration_When_CodeAlreadyExists() {
            // Given – first call returns duplicate, second returns unique
            when(itemRepository.existsByCode(anyString()))
                    .thenReturn(true)
                    .thenReturn(false);

            // When
            String code = barcodeService.generateUniqueItemCode();

            // Then
            assertThat(code).hasSize(16).startsWith("01");
            verify(itemRepository, times(2)).existsByCode(anyString());
        }

        @Test
        void should_ThrowException_When_MaxRetryExceeded() {
            // Given – always returns duplicate
            when(itemRepository.existsByCode(anyString())).thenReturn(true);

            // When / Then
            assertThatThrownBy(() -> barcodeService.generateUniqueItemCode())
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("BARCODE_GENERATION_FAILED");
        }
    }

    // ── ensureItemCode ───────────────────────────────────────────────

    @Nested
    @DisplayName("ensureItemCode")
    class EnsureItemCode {

        @Test
        void should_EnsureItemCode_When_CodeMissing() {
            // Given
            Item item = new Item();
            item.setCode(null);
            when(itemRepository.existsByCode(anyString())).thenReturn(false);

            // When
            barcodeService.ensureItemCode(item);

            // Then
            assertThat(item.getCode())
                    .isNotNull()
                    .hasSize(16)
                    .startsWith("01");
            verify(itemRepository).save(item);
        }

        @Test
        void should_NotOverwrite_When_CodeAlreadyValid() {
            // Given – item already has a valid 16-digit code starting with "01"
            Item item = new Item();
            item.setCode("0199887766554433");

            // When
            barcodeService.ensureItemCode(item);

            // Then
            assertThat(item.getCode()).isEqualTo("0199887766554433");
            verify(itemRepository, never()).save(item);
        }
    }

    // ── ensureItemQrCode ─────────────────────────────────────────────

    @Nested
    @DisplayName("ensureItemQrCode")
    class EnsureItemQrCode {

        @Test
        void should_GenerateQrCode_When_Missing() {
            // Given
            Item item = new Item();
            item.setCode("0112345678901234");
            item.setQrCode(null);

            // When
            barcodeService.ensureItemQrCode(item);

            // Then
            assertThat(item.getQrCode()).isEqualTo("QR-0112345678901234");
            verify(itemRepository).save(item);
        }

        @Test
        void should_NotOverwrite_When_QrCodeAlreadyExists() {
            // Given
            Item item = new Item();
            item.setQrCode("QR-EXISTING");

            // When
            barcodeService.ensureItemQrCode(item);

            // Then
            assertThat(item.getQrCode()).isEqualTo("QR-EXISTING");
            verify(itemRepository, never()).save(item);
        }
    }

    // ── buildPlacementCode ───────────────────────────────────────────

    @Nested
    @DisplayName("buildPlacementCode")
    class BuildPlacementCode {

        @Test
        void should_BuildPlacementCode_When_ValidItemCode() {
            // Given
            String itemCode = "0112345678901234";
            when(assortmentRepository.existsByCode(anyString())).thenReturn(false);

            // When
            String placementCode = barcodeService.buildPlacementCode(itemCode);

            // Then
            assertThat(placementCode)
                    .isNotBlank()
                    .contains(itemCode) // should embed the item code
                    .matches("\\d+"); // all digits
            // Format: 11YYMMDD + itemCode(16) + 21XXXXXX → 8 + 16 + 8 = 32
            assertThat(placementCode).hasSize(32);
        }

        @Test
        void should_ThrowException_When_InvalidItemCodeForPlacement() {
            // Given – null
            assertThatThrownBy(() -> barcodeService.buildPlacementCode(null))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("BARCODE_MUST_BE_16_DIGITS");

            // Given – too short
            assertThatThrownBy(() -> barcodeService.buildPlacementCode("1234"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("BARCODE_MUST_BE_16_DIGITS");
        }

        @Test
        void should_RetryPlacementCode_When_CodeAlreadyExists() {
            // Given
            String itemCode = "0112345678901234";
            when(assortmentRepository.existsByCode(anyString()))
                    .thenReturn(true)
                    .thenReturn(false);

            // When
            String placementCode = barcodeService.buildPlacementCode(itemCode);

            // Then
            assertThat(placementCode).isNotBlank();
            verify(assortmentRepository, times(2)).existsByCode(anyString());
        }
    }

    // ── QR code validation ───────────────────────────────────────────

    @Nested
    @DisplayName("QR code utilities")
    class QrCodeUtilities {

        @Test
        void should_ValidateQrCode_When_FormatCorrect() {
            // Given / When / Then
            assertThat(barcodeService.validateQrCode("QR-12345")).isTrue();
            assertThat(barcodeService.validateQrCode("QR-ABCDE")).isTrue();
        }

        @Test
        void should_RejectQrCode_When_FormatInvalid() {
            // Given / When / Then
            assertThat(barcodeService.validateQrCode("INVALID")).isFalse();
            assertThat(barcodeService.validateQrCode("QR-")).isFalse();
        }

        @Test
        void should_AcceptNullOrBlank_When_QrCodeOptional() {
            // Given / When / Then – null and blank are valid (QR code is optional)
            assertThat(barcodeService.validateQrCode(null)).isTrue();
            assertThat(barcodeService.validateQrCode("")).isTrue();
        }

        @Test
        void should_GenerateQrCodeFromBarcode_When_Called() {
            // Given / When
            String qr = barcodeService.generateQrCodeFromBarcode("0112345678901234");

            // Then
            assertThat(qr).isEqualTo("QR-0112345678901234");
        }
    }
}
