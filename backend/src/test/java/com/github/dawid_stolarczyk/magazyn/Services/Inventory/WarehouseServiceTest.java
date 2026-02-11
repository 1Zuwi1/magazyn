package com.github.dawid_stolarczyk.magazyn.Services.Inventory;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.WarehouseCreateRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.WarehouseDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.WarehouseUpdateRequest;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Rack;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Warehouse;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.AssortmentRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.WarehouseRepository;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WarehouseServiceTest {

    @Mock
    private WarehouseRepository warehouseRepository;

    @Mock
    private AssortmentRepository assortmentRepository;

    @Mock
    private Bucket4jRateLimiter rateLimiter;

    @Mock
    private HttpServletRequest httpRequest;

    @InjectMocks
    private WarehouseService warehouseService;

    @BeforeEach
    void setUp() {
        when(httpRequest.getRemoteAddr()).thenReturn("127.0.0.1");
    }

    private Warehouse buildWarehouse(Long id, String name, List<Rack> racks) {
        Warehouse wh = Warehouse.builder()
                .id(id)
                .name(name)
                .racks(racks != null ? racks : new ArrayList<>())
                .build();
        return wh;
    }

    // ── Create ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("createWarehouse")
    class CreateWarehouse {

        @Test
        void should_CreateWarehouse_When_ValidRequest() {
            // Given
            WarehouseCreateRequest request = WarehouseCreateRequest.builder()
                    .name("Central Warehouse")
                    .build();

            Warehouse saved = buildWarehouse(1L, "Central Warehouse", new ArrayList<>());
            when(warehouseRepository.save(any(Warehouse.class))).thenReturn(saved);
            when(assortmentRepository.countByRack_WarehouseId(1L)).thenReturn(0L);

            // When
            WarehouseDto result = warehouseService.createWarehouse(request, httpRequest);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getName()).isEqualTo("Central Warehouse");
            assertThat(result.getId()).isEqualTo(1L);
            verify(warehouseRepository).save(any(Warehouse.class));
        }
    }

    // ── Read ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getWarehouseById")
    class GetWarehouseById {

        @Test
        void should_ReturnWarehouse_When_FoundById() {
            // Given
            Warehouse wh = buildWarehouse(1L, "Test Warehouse", new ArrayList<>());
            when(warehouseRepository.findById(1L)).thenReturn(Optional.of(wh));
            when(assortmentRepository.countByRack_WarehouseId(1L)).thenReturn(0L);

            // When
            WarehouseDto result = warehouseService.getWarehouseById(1L, httpRequest);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getName()).isEqualTo("Test Warehouse");
            assertThat(result.getTotalSlots()).isZero();
        }

        @Test
        void should_ThrowException_When_WarehouseNotFound() {
            // Given
            when(warehouseRepository.findById(999L)).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> warehouseService.getWarehouseById(999L, httpRequest))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("WAREHOUSE_NOT_FOUND");
        }
    }

    // ── Update ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("updateWarehouse")
    class UpdateWarehouse {

        @Test
        void should_UpdateWarehouse_When_Exists() {
            // Given
            Warehouse existing = buildWarehouse(1L, "Old Name", new ArrayList<>());
            when(warehouseRepository.findById(1L)).thenReturn(Optional.of(existing));
            when(warehouseRepository.save(any(Warehouse.class))).thenReturn(existing);
            when(assortmentRepository.countByRack_WarehouseId(1L)).thenReturn(0L);

            WarehouseUpdateRequest request = WarehouseUpdateRequest.builder()
                    .name("New Name")
                    .build();

            // When
            WarehouseDto result = warehouseService.updateWarehouse(1L, request, httpRequest);

            // Then
            assertThat(result).isNotNull();
            verify(warehouseRepository).save(existing);
        }
    }

    // ── Delete ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("deleteWarehouse")
    class DeleteWarehouse {

        @Test
        void should_DeleteWarehouse_When_Exists() {
            // Given
            Warehouse wh = buildWarehouse(1L, "To Delete", new ArrayList<>());
            when(warehouseRepository.findById(1L)).thenReturn(Optional.of(wh));

            // When
            warehouseService.deleteWarehouse(1L, httpRequest);

            // Then
            verify(warehouseRepository).delete(wh);
        }

        @Test
        void should_ThrowException_When_DeleteNonExistentWarehouse() {
            // Given
            when(warehouseRepository.findById(999L)).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> warehouseService.deleteWarehouse(999L, httpRequest))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("WAREHOUSE_NOT_FOUND");
        }
    }

    // ── Summary / occupancy calculation ──────────────────────────────

    @Nested
    @DisplayName("occupancy calculations")
    class OccupancyCalculations {

        @Test
        void should_CalculateSummary_When_WarehousesHaveRacks() {
            // Given – warehouse with one 5x4 rack, 10 occupied slots
            Rack rack = new Rack();
            rack.setId(10L);
            rack.setSize_x(5);
            rack.setSize_y(4);
            rack.setAssortments(new ArrayList<>());

            Warehouse wh = buildWarehouse(1L, "Full Warehouse", List.of(rack));
            rack.setWarehouse(wh);

            when(warehouseRepository.findById(1L)).thenReturn(Optional.of(wh));
            when(assortmentRepository.countByRack_WarehouseId(1L)).thenReturn(10L);

            // When
            WarehouseDto dto = warehouseService.getWarehouseById(1L, httpRequest);

            // Then
            assertThat(dto.getTotalSlots()).isEqualTo(20); // 5 * 4
            assertThat(dto.getOccupiedSlots()).isEqualTo(10);
            assertThat(dto.getFreeSlots()).isEqualTo(10);
            assertThat(dto.getOccupancy()).isEqualTo(50); // 10/20 * 100
        }
    }
}
