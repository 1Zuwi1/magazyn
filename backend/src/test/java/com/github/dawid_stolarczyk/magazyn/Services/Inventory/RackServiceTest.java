package com.github.dawid_stolarczyk.magazyn.Services.Inventory;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.RackCreateRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.RackDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.RackUpdateRequest;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Assortment;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Item;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Rack;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Warehouse;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.AssortmentRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.RackRepository;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RackServiceTest {

    @Mock
    private RackRepository rackRepository;

    @Mock
    private WarehouseRepository warehouseRepository;

    @Mock
    private AssortmentRepository assortmentRepository;

    @Mock
    private Bucket4jRateLimiter rateLimiter;

    @Mock
    private HttpServletRequest httpRequest;

    @InjectMocks
    private RackService rackService;

    private Warehouse sampleWarehouse;

    @BeforeEach
    void setUp() {
        when(httpRequest.getRemoteAddr()).thenReturn("127.0.0.1");

        sampleWarehouse = Warehouse.builder()
                .id(1L)
                .name("Main Warehouse")
                .racks(new ArrayList<>())
                .build();
    }

    private Rack buildRack(Long id, String marker, Warehouse warehouse) {
        Rack rack = new Rack();
        rack.setId(id);
        rack.setMarker(marker);
        rack.setWarehouse(warehouse);
        rack.setSize_x(5);
        rack.setSize_y(4);
        rack.setMin_temp(-20f);
        rack.setMax_temp(25f);
        rack.setMax_weight(1000f);
        rack.setMax_size_x(1500f);
        rack.setMax_size_y(2000f);
        rack.setMax_size_z(1000f);
        rack.setAcceptsDangerous(false);
        rack.setAssortments(new ArrayList<>());
        return rack;
    }

    private RackCreateRequest buildCreateRequest(String marker, Long warehouseId) {
        return RackCreateRequest.builder()
                .marker(marker)
                .warehouseId(warehouseId)
                .sizeX(5)
                .sizeY(4)
                .minTemp(-20f)
                .maxTemp(25f)
                .maxWeight(1000f)
                .maxSizeX(1500f)
                .maxSizeY(2000f)
                .maxSizeZ(1000f)
                .acceptsDangerous(false)
                .build();
    }

    // ── Create ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("createRack")
    class CreateRack {

        @Test
        void should_CreateRack_When_ValidRequest() {
            // Given
            RackCreateRequest request = buildCreateRequest("A-01", 1L);
            Rack savedRack = buildRack(10L, "A-01", sampleWarehouse);

            when(warehouseRepository.findById(1L)).thenReturn(Optional.of(sampleWarehouse));
            when(rackRepository.existsByWarehouseIdAndMarker(eq(1L), anyString())).thenReturn(false);
            when(rackRepository.save(any(Rack.class))).thenReturn(savedRack);

            // When
            RackDto result = rackService.createRack(request, httpRequest);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(10L);
            assertThat(result.getSizeX()).isEqualTo(5);
            assertThat(result.getSizeY()).isEqualTo(4);
            assertThat(result.getTotalSlots()).isEqualTo(20);
            verify(rackRepository).save(any(Rack.class));
        }

        @Test
        void should_ThrowException_When_WarehouseNotFoundForRack() {
            // Given
            RackCreateRequest request = buildCreateRequest("A-01", 999L);
            when(warehouseRepository.findById(999L)).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> rackService.createRack(request, httpRequest))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("WAREHOUSE_NOT_FOUND");
        }

        @Test
        void should_ThrowException_When_DuplicateMarker() {
            // Given
            RackCreateRequest request = buildCreateRequest("A-01", 1L);
            when(warehouseRepository.findById(1L)).thenReturn(Optional.of(sampleWarehouse));
            when(rackRepository.existsByWarehouseIdAndMarker(eq(1L), anyString())).thenReturn(true);

            // When / Then
            assertThatThrownBy(() -> rackService.createRack(request, httpRequest))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("RACK_MARKER_DUPLICATE");
        }

        @Test
        void should_ThrowException_When_InvalidTemperatureRange() {
            // Given – minTemp > maxTemp
            RackCreateRequest request = RackCreateRequest.builder()
                    .marker("B-01")
                    .warehouseId(1L)
                    .sizeX(5)
                    .sizeY(4)
                    .minTemp(30f) // higher than maxTemp
                    .maxTemp(20f)
                    .build();

            // When / Then
            assertThatThrownBy(() -> rackService.createRack(request, httpRequest))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("INVALID_TEMPERATURE_RANGE");
        }

        @Test
        void should_ThrowException_When_InvalidDimensions() {
            // Given – sizeX = 0
            RackCreateRequest request = RackCreateRequest.builder()
                    .marker("C-01")
                    .warehouseId(1L)
                    .sizeX(0)
                    .sizeY(4)
                    .minTemp(-20f)
                    .maxTemp(25f)
                    .build();

            // When / Then
            assertThatThrownBy(() -> rackService.createRack(request, httpRequest))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("INVALID_DIMENSIONS");
        }
    }

    // ── Read ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getRackById")
    class GetRackById {

        @Test
        void should_ReturnRack_When_FoundById() {
            // Given
            Rack rack = buildRack(10L, "A-01", sampleWarehouse);
            when(rackRepository.findById(10L)).thenReturn(Optional.of(rack));

            // When
            RackDto result = rackService.getRackById(10L, httpRequest);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(10L);
            assertThat(result.getMarker()).isEqualTo("A-01");
            assertThat(result.getWarehouseId()).isEqualTo(1L);
        }

        @Test
        void should_ThrowException_When_RackNotFound() {
            // Given
            when(rackRepository.findById(999L)).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> rackService.getRackById(999L, httpRequest))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("RACK_NOT_FOUND");
        }
    }

    // ── Update ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("updateRack")
    class UpdateRack {

        @Test
        void should_UpdateRack_When_Exists() {
            // Given
            Rack existing = buildRack(10L, "A-01", sampleWarehouse);
            RackUpdateRequest request = RackUpdateRequest.builder()
                    .marker("A-02")
                    .warehouseId(1L)
                    .sizeX(6)
                    .sizeY(5)
                    .minTemp(-10f)
                    .maxTemp(30f)
                    .maxWeight(1500f)
                    .maxSizeX(2000f)
                    .maxSizeY(2500f)
                    .maxSizeZ(1200f)
                    .acceptsDangerous(true)
                    .build();

            when(rackRepository.findById(10L)).thenReturn(Optional.of(existing));
            when(warehouseRepository.findById(1L)).thenReturn(Optional.of(sampleWarehouse));
            when(rackRepository.findByWarehouseIdAndMarker(eq(1L), anyString())).thenReturn(Optional.empty());
            when(rackRepository.save(any(Rack.class))).thenReturn(existing);

            // When
            RackDto result = rackService.updateRack(10L, request, httpRequest);

            // Then
            assertThat(result).isNotNull();
            verify(rackRepository).save(existing);
        }

        @Test
        void should_PreventDisablingDangerous_When_RackContainsDangerousItems() {
            // Given – rack currently accepts dangerous, has a dangerous item stored
            Rack existing = buildRack(10L, "A-01", sampleWarehouse);
            existing.setAcceptsDangerous(true);

            Item dangerousItem = new Item();
            dangerousItem.setId(1L);
            dangerousItem.setDangerous(true);

            Assortment assortmentWithDangerousItem = Assortment.builder()
                    .id(100L)
                    .item(dangerousItem)
                    .rack(existing)
                    .build();
            existing.setAssortments(List.of(assortmentWithDangerousItem));

            RackUpdateRequest request = RackUpdateRequest.builder()
                    .marker("A-01")
                    .warehouseId(1L)
                    .sizeX(5)
                    .sizeY(4)
                    .minTemp(-20f)
                    .maxTemp(25f)
                    .acceptsDangerous(false) // trying to disable
                    .build();

            when(rackRepository.findById(10L)).thenReturn(Optional.of(existing));
            when(warehouseRepository.findById(1L)).thenReturn(Optional.of(sampleWarehouse));

            // When / Then
            assertThatThrownBy(() -> rackService.updateRack(10L, request, httpRequest))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("RACK_HAS_DANGEROUS_ITEMS");
        }
    }

    // ── Delete ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("deleteRack")
    class DeleteRack {

        @Test
        void should_DeleteRack_When_Exists() {
            // Given
            Rack rack = buildRack(10L, "A-01", sampleWarehouse);
            when(rackRepository.findById(10L)).thenReturn(Optional.of(rack));

            // When
            rackService.deleteRack(10L, httpRequest);

            // Then
            verify(rackRepository).delete(rack);
        }

        @Test
        void should_ThrowException_When_DeleteNonExistentRack() {
            // Given
            when(rackRepository.findById(999L)).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> rackService.deleteRack(999L, httpRequest))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("RACK_NOT_FOUND");
        }
    }
}
