package com.github.dawid_stolarczyk.magazyn.Services.Inventory;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.Assortment;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Item;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.AssortmentRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.ItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SmartCodeServiceTest {

    @Mock
    private ItemRepository itemRepository;

    @Mock
    private AssortmentRepository assortmentRepository;

    @InjectMocks
    private SmartCodeService smartCodeService;

    private Item sampleItem;
    private Assortment sampleAssortment;

    @BeforeEach
    void setUp() {
        sampleItem = new Item();
        sampleItem.setId(1L);
        sampleItem.setName("Test Item");
        sampleItem.setCode("0112345678901234");

        sampleAssortment = new Assortment();
        sampleAssortment.setId(10L);
        sampleAssortment.setCode("0112345678901234");
    }

    // ── Item lookup ──────────────────────────────────────────────────

    @Nested
    @DisplayName("findItemBySmartCode")
    class FindItemBySmartCode {

        @Test
        void should_FindItem_When_DirectCodeMatch() {
            // Given
            String code = "0112345678901234";
            when(itemRepository.findByCodeOrQrCode(code)).thenReturn(Optional.of(sampleItem));

            // When
            Item result = smartCodeService.findItemBySmartCode(code);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(1L);
            verify(itemRepository).findByCodeOrQrCode(code);
        }

        @Test
        void should_FindItem_When_14DigitCodeWithoutPrefix() {
            // Given – 14-digit code, direct lookup fails, lookup with "01" prefix succeeds
            String code14 = "12345678901234";
            String codeWithPrefix = "01" + code14;
            when(itemRepository.findByCodeOrQrCode(code14)).thenReturn(Optional.empty());
            when(itemRepository.findByCodeOrQrCode(codeWithPrefix)).thenReturn(Optional.of(sampleItem));

            // When
            Item result = smartCodeService.findItemBySmartCode(code14);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(1L);
        }

        @Test
        void should_FindItem_When_16DigitCodeWithPrefix() {
            // Given – 16-digit code, direct lookup fails, lookup without first 2 chars
            // succeeds
            String code16 = "9912345678901234";
            String codeWithout = code16.substring(2); // "12345678901234"
            when(itemRepository.findByCodeOrQrCode(code16)).thenReturn(Optional.empty());
            when(itemRepository.findByCodeOrQrCode(codeWithout)).thenReturn(Optional.of(sampleItem));

            // When
            Item result = smartCodeService.findItemBySmartCode(code16);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(1L);
        }

        @Test
        void should_ThrowException_When_NoCodeVariationMatchesItem() {
            // Given – all lookup strategies fail
            String code = "nonexistentcode";
            when(itemRepository.findByCodeOrQrCode(code)).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> smartCodeService.findItemBySmartCode(code))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("ITEM_NOT_FOUND");
        }
    }

    // ── Assortment lookup ────────────────────────────────────────────

    @Nested
    @DisplayName("findAssortmentBySmartCode")
    class FindAssortmentBySmartCode {

        @Test
        void should_FindAssortment_When_DirectCodeMatch() {
            // Given
            String code = "0112345678901234";
            when(assortmentRepository.findByCode(code)).thenReturn(Optional.of(sampleAssortment));

            // When
            Assortment result = smartCodeService.findAssortmentBySmartCode(code);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(10L);
            verify(assortmentRepository).findByCode(code);
        }

        @Test
        void should_FindAssortment_When_14DigitCodeWithoutPrefix() {
            // Given
            String code14 = "12345678901234";
            String codeWithPrefix = "01" + code14;
            when(assortmentRepository.findByCode(code14)).thenReturn(Optional.empty());
            when(assortmentRepository.findByCode(codeWithPrefix)).thenReturn(Optional.of(sampleAssortment));

            // When
            Assortment result = smartCodeService.findAssortmentBySmartCode(code14);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(10L);
        }

        @Test
        void should_ThrowException_When_AssortmentNotFound() {
            // Given
            String code = "unknowncode";
            when(assortmentRepository.findByCode(code)).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> smartCodeService.findAssortmentBySmartCode(code))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("ASSORTMENT_NOT_FOUND");
        }
    }
}
