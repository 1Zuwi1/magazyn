package com.github.dawid_stolarczyk.magazyn.Services.Inventory;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.PlacementConfirmationRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.PlacementConfirmationResponse;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.PlacementPlanRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.PlacementSlotRequest;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.*;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.Status2FA;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.*;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.AuthUtil;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.Entity.AuthPrincipal;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InboundServiceTest {

    @Mock
    private ItemRepository itemRepository;
    @Mock
    private RackRepository rackRepository;
    @Mock
    private AssortmentRepository assortmentRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private WarehouseRepository warehouseRepository;
    @Mock
    private BarcodeService barcodeService;
    @Mock
    private SmartCodeService smartCodeService;
    @Mock
    private PositionReservationRepository reservationRepository;
    @Mock
    private InboundOperationRepository inboundOperationRepository;
    @Mock
    private Bucket4jRateLimiter rateLimiter;
    @Mock
    private HttpServletRequest httpRequest;

    @InjectMocks
    private InboundService inboundService;

    private Item sampleItem;
    private Rack sampleRack;
    private User sampleUser;
    private Warehouse sampleWarehouse;

    @BeforeEach
    void setUp() {
        when(httpRequest.getRemoteAddr()).thenReturn("127.0.0.1");

        sampleWarehouse = Warehouse.builder()
                .id(1L)
                .name("Main WH")
                .racks(new ArrayList<>())
                .build();

        sampleItem = new Item();
        sampleItem.setId(1L);
        sampleItem.setName("Test Item");
        sampleItem.setCode("0112345678901234");
        sampleItem.setWeight(5.0f);
        sampleItem.setMin_temp(-30f);
        sampleItem.setMax_temp(40f);
        sampleItem.setDangerous(false);
        sampleItem.setSize_x(100f);
        sampleItem.setSize_y(200f);
        sampleItem.setSize_z(300f);

        sampleRack = new Rack();
        sampleRack.setId(10L);
        sampleRack.setMarker("A-01");
        sampleRack.setWarehouse(sampleWarehouse);
        sampleRack.setSize_x(3);
        sampleRack.setSize_y(3);
        sampleRack.setMin_temp(-20f);
        sampleRack.setMax_temp(30f);
        sampleRack.setMax_weight(100f);
        sampleRack.setMax_size_x(500f);
        sampleRack.setMax_size_y(500f);
        sampleRack.setMax_size_z(500f);
        sampleRack.setAcceptsDangerous(false);
        sampleRack.setAssortments(new ArrayList<>());

        sampleUser = new User();
        sampleUser.setId(100L);
        sampleUser.setFullName("Jan Kowalski");
    }

    // ── buildPlacementPlan ───────────────────────────────────────────

    @Nested
    @DisplayName("buildPlacementPlan")
    class BuildPlacementPlan {

        @Test
        void should_ReturnNoMatch_When_ItemNotFound() {
            // Given
            PlacementPlanRequest request = new PlacementPlanRequest();
            request.setItemId(999L);
            request.setQuantity(1);

            when(itemRepository.findById(999L)).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> inboundService.buildPlacementPlan(request, httpRequest))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("ITEM_NOT_FOUND");
        }

        @Test
        void should_ReturnNoMatch_When_NoCompatibleRacks() {
            // Given — no racks available
            PlacementPlanRequest request = new PlacementPlanRequest();
            request.setItemId(1L);
            request.setQuantity(1);

            try (MockedStatic<AuthUtil> authMock = mockStatic(AuthUtil.class)) {
                authMock.when(AuthUtil::getCurrentAuthPrincipal)
                        .thenReturn(new AuthPrincipal(100L, Status2FA.VERIFIED, false));

                when(itemRepository.findById(1L)).thenReturn(Optional.of(sampleItem));
                when(userRepository.findById(100L)).thenReturn(Optional.of(sampleUser));
                when(rackRepository.findAll()).thenReturn(Collections.emptyList());

                // When
                InboundService.PlacementPlanResult result = inboundService.buildPlacementPlan(request, httpRequest);

                // Then
                assertThat(result.success()).isFalse();
                assertThat(result.code()).isNotNull();
                assertThat(result.response()).isNull();
            }
        }

        @Test
        void should_AllocatePositions_When_SingleRackHasSpace() {
            // Given — rack has 3x3 = 9 positions, request 2
            PlacementPlanRequest request = new PlacementPlanRequest();
            request.setItemId(1L);
            request.setQuantity(2);

            try (MockedStatic<AuthUtil> authMock = mockStatic(AuthUtil.class)) {
                authMock.when(AuthUtil::getCurrentAuthPrincipal)
                        .thenReturn(new AuthPrincipal(100L, Status2FA.VERIFIED, false));

                when(itemRepository.findById(1L)).thenReturn(Optional.of(sampleItem));
                when(userRepository.findById(100L)).thenReturn(Optional.of(sampleUser));
                when(rackRepository.findAll()).thenReturn(List.of(sampleRack));
                when(assortmentRepository.findByRackId(10L)).thenReturn(Collections.emptyList());
                when(reservationRepository.findActiveReservationsForRack(eq(10L), any(Timestamp.class)))
                        .thenReturn(Collections.emptyList());

                // When
                InboundService.PlacementPlanResult result = inboundService.buildPlacementPlan(request, httpRequest);

                // Then
                assertThat(result.success()).isTrue();
                assertThat(result.response()).isNotNull();
                assertThat(result.response().getAllocatedQuantity()).isEqualTo(2);
                assertThat(result.response().getRemainingQuantity()).isZero();
                assertThat(result.response().getPlacements()).hasSize(2);
            }
        }

        @Test
        void should_FilterRacksByWarehouse_When_WarehouseIdProvided() {
            // Given
            PlacementPlanRequest request = new PlacementPlanRequest();
            request.setItemId(1L);
            request.setQuantity(1);
            request.setWarehouseId(1L);

            try (MockedStatic<AuthUtil> authMock = mockStatic(AuthUtil.class)) {
                authMock.when(AuthUtil::getCurrentAuthPrincipal)
                        .thenReturn(new AuthPrincipal(100L, Status2FA.VERIFIED, false));

                when(itemRepository.findById(1L)).thenReturn(Optional.of(sampleItem));
                when(userRepository.findById(100L)).thenReturn(Optional.of(sampleUser));
                when(warehouseRepository.existsById(1L)).thenReturn(true);
                when(rackRepository.findByWarehouseId(1L)).thenReturn(List.of(sampleRack));
                when(assortmentRepository.findByRackId(10L)).thenReturn(Collections.emptyList());
                when(reservationRepository.findActiveReservationsForRack(eq(10L), any(Timestamp.class)))
                        .thenReturn(Collections.emptyList());

                // When
                InboundService.PlacementPlanResult result = inboundService.buildPlacementPlan(request, httpRequest);

                // Then
                assertThat(result.success()).isTrue();
                verify(rackRepository).findByWarehouseId(1L);
                verify(rackRepository, never()).findAll();
            }
        }

        @Test
        void should_ReservePositions_When_ReserveIsTrue() {
            // Given
            PlacementPlanRequest request = new PlacementPlanRequest();
            request.setItemId(1L);
            request.setQuantity(2);
            request.setReserve(true);

            try (MockedStatic<AuthUtil> authMock = mockStatic(AuthUtil.class)) {
                authMock.when(AuthUtil::getCurrentAuthPrincipal)
                        .thenReturn(new AuthPrincipal(100L, Status2FA.VERIFIED, false));

                when(itemRepository.findById(1L)).thenReturn(Optional.of(sampleItem));
                when(userRepository.findById(100L)).thenReturn(Optional.of(sampleUser));
                when(rackRepository.findAll()).thenReturn(List.of(sampleRack));
                when(assortmentRepository.findByRackId(10L)).thenReturn(Collections.emptyList());
                when(reservationRepository.findActiveReservationsForRack(eq(10L), any(Timestamp.class)))
                        .thenReturn(Collections.emptyList());

                // When
                InboundService.PlacementPlanResult result = inboundService.buildPlacementPlan(request, httpRequest);

                // Then
                assertThat(result.success()).isTrue();
                assertThat(result.response().getReserved()).isTrue();
                assertThat(result.response().getReservedUntil()).isNotNull();
                verify(reservationRepository).saveAll(anyList());
            }
        }
    }

    // ── confirmPlacement ─────────────────────────────────────────────

    @Nested
    @DisplayName("confirmPlacement")
    class ConfirmPlacement {

        @Test
        void should_ConfirmPlacement_When_ValidRequestWithItemId() {
            // Given
            PlacementSlotRequest slot = new PlacementSlotRequest();
            slot.setRackId(10L);
            slot.setPositionX(1);
            slot.setPositionY(1);

            PlacementConfirmationRequest request = new PlacementConfirmationRequest();
            request.setItemId(1L);
            request.setPlacements(List.of(slot));

            try (MockedStatic<AuthUtil> authMock = mockStatic(AuthUtil.class)) {
                authMock.when(AuthUtil::getCurrentAuthPrincipal)
                        .thenReturn(new AuthPrincipal(100L, Status2FA.VERIFIED, false));

                when(itemRepository.findById(1L)).thenReturn(Optional.of(sampleItem));
                when(userRepository.findById(100L)).thenReturn(Optional.of(sampleUser));
                when(rackRepository.findById(10L)).thenReturn(Optional.of(sampleRack));
                when(assortmentRepository.findByRackId(10L)).thenReturn(Collections.emptyList());
                when(barcodeService.buildPlacementCode(anyString())).thenReturn("PLACEMENT-CODE-001");
                when(reservationRepository.findActiveReservation(eq(10L), eq(1), eq(1), any(Timestamp.class)))
                        .thenReturn(Optional.empty());

                // When
                PlacementConfirmationResponse result = inboundService.confirmPlacement(request, httpRequest);

                // Then
                assertThat(result).isNotNull();
                assertThat(result.getItemId()).isEqualTo(1L);
                assertThat(result.getStoredQuantity()).isEqualTo(1);
                assertThat(result.getCodes()).hasSize(1);
                verify(assortmentRepository, times(2)).saveAll(anyList());
                verify(inboundOperationRepository).saveAll(anyList());
            }
        }

        @Test
        void should_ConfirmPlacement_When_ValidRequestWithBarcode() {
            // Given
            PlacementSlotRequest slot = new PlacementSlotRequest();
            slot.setRackId(10L);
            slot.setPositionX(2);
            slot.setPositionY(3);

            PlacementConfirmationRequest request = new PlacementConfirmationRequest();
            request.setCode("0112345678901234");
            request.setPlacements(List.of(slot));

            try (MockedStatic<AuthUtil> authMock = mockStatic(AuthUtil.class)) {
                authMock.when(AuthUtil::getCurrentAuthPrincipal)
                        .thenReturn(new AuthPrincipal(100L, Status2FA.VERIFIED, false));

                when(smartCodeService.findItemBySmartCode("0112345678901234")).thenReturn(sampleItem);
                when(userRepository.findById(100L)).thenReturn(Optional.of(sampleUser));
                when(rackRepository.findById(10L)).thenReturn(Optional.of(sampleRack));
                when(assortmentRepository.findByRackId(10L)).thenReturn(Collections.emptyList());
                when(barcodeService.buildPlacementCode(anyString())).thenReturn("PLACEMENT-CODE-002");
                when(reservationRepository.findActiveReservation(eq(10L), eq(2), eq(3), any(Timestamp.class)))
                        .thenReturn(Optional.empty());

                // When
                PlacementConfirmationResponse result = inboundService.confirmPlacement(request, httpRequest);

                // Then
                assertThat(result).isNotNull();
                assertThat(result.getItemId()).isEqualTo(1L);
                verify(smartCodeService).findItemBySmartCode("0112345678901234");
            }
        }

        @Test
        void should_ThrowException_When_NeitherItemIdNorCodeProvided() {
            // Given
            PlacementSlotRequest slot = new PlacementSlotRequest();
            slot.setRackId(10L);
            slot.setPositionX(1);
            slot.setPositionY(1);

            PlacementConfirmationRequest request = new PlacementConfirmationRequest();
            request.setPlacements(List.of(slot));
            // no itemId, no code

            // When / Then
            assertThatThrownBy(() -> inboundService.confirmPlacement(request, httpRequest))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("itemId or code");
        }

        @Test
        void should_ThrowException_When_RackNotFound() {
            // Given
            PlacementSlotRequest slot = new PlacementSlotRequest();
            slot.setRackId(999L);
            slot.setPositionX(1);
            slot.setPositionY(1);

            PlacementConfirmationRequest request = new PlacementConfirmationRequest();
            request.setItemId(1L);
            request.setPlacements(List.of(slot));

            try (MockedStatic<AuthUtil> authMock = mockStatic(AuthUtil.class)) {
                authMock.when(AuthUtil::getCurrentAuthPrincipal)
                        .thenReturn(new AuthPrincipal(100L, Status2FA.VERIFIED, false));

                when(itemRepository.findById(1L)).thenReturn(Optional.of(sampleItem));
                when(userRepository.findById(100L)).thenReturn(Optional.of(sampleUser));
                when(rackRepository.findById(999L)).thenReturn(Optional.empty());

                // When / Then
                assertThatThrownBy(() -> inboundService.confirmPlacement(request, httpRequest))
                        .isInstanceOf(IllegalArgumentException.class)
                        .hasMessageContaining("PLACEMENT_INVALID");
            }
        }

        @Test
        void should_ThrowException_When_PositionOutOfBounds() {
            // Given – position (10, 10) exceeds rack size (3, 3)
            PlacementSlotRequest slot = new PlacementSlotRequest();
            slot.setRackId(10L);
            slot.setPositionX(10);
            slot.setPositionY(10);

            PlacementConfirmationRequest request = new PlacementConfirmationRequest();
            request.setItemId(1L);
            request.setPlacements(List.of(slot));

            try (MockedStatic<AuthUtil> authMock = mockStatic(AuthUtil.class)) {
                authMock.when(AuthUtil::getCurrentAuthPrincipal)
                        .thenReturn(new AuthPrincipal(100L, Status2FA.VERIFIED, false));

                when(itemRepository.findById(1L)).thenReturn(Optional.of(sampleItem));
                when(userRepository.findById(100L)).thenReturn(Optional.of(sampleUser));
                when(rackRepository.findById(10L)).thenReturn(Optional.of(sampleRack));
                when(assortmentRepository.findByRackId(10L)).thenReturn(Collections.emptyList());

                // When / Then
                assertThatThrownBy(() -> inboundService.confirmPlacement(request, httpRequest))
                        .isInstanceOf(IllegalArgumentException.class)
                        .hasMessageContaining("PLACEMENT_INVALID");
            }
        }

        @Test
        void should_ThrowException_When_PositionAlreadyOccupied() {
            // Given – position (1, 1) is already occupied
            Assortment existing = new Assortment();
            existing.setId(50L);
            existing.setPositionX(1);
            existing.setPositionY(1);
            existing.setRack(sampleRack);
            existing.setItem(sampleItem);

            PlacementSlotRequest slot = new PlacementSlotRequest();
            slot.setRackId(10L);
            slot.setPositionX(1);
            slot.setPositionY(1);

            PlacementConfirmationRequest request = new PlacementConfirmationRequest();
            request.setItemId(1L);
            request.setPlacements(List.of(slot));

            try (MockedStatic<AuthUtil> authMock = mockStatic(AuthUtil.class)) {
                authMock.when(AuthUtil::getCurrentAuthPrincipal)
                        .thenReturn(new AuthPrincipal(100L, Status2FA.VERIFIED, false));

                when(itemRepository.findById(1L)).thenReturn(Optional.of(sampleItem));
                when(userRepository.findById(100L)).thenReturn(Optional.of(sampleUser));
                when(rackRepository.findById(10L)).thenReturn(Optional.of(sampleRack));
                when(assortmentRepository.findByRackId(10L)).thenReturn(List.of(existing));

                // When / Then
                assertThatThrownBy(() -> inboundService.confirmPlacement(request, httpRequest))
                        .isInstanceOf(IllegalArgumentException.class)
                        .hasMessageContaining("PLACEMENT_INVALID");
            }
        }

        @Test
        void should_CreateAuditRecord_When_PlacementConfirmed() {
            // Given
            PlacementSlotRequest slot = new PlacementSlotRequest();
            slot.setRackId(10L);
            slot.setPositionX(1);
            slot.setPositionY(1);

            PlacementConfirmationRequest request = new PlacementConfirmationRequest();
            request.setItemId(1L);
            request.setPlacements(List.of(slot));

            try (MockedStatic<AuthUtil> authMock = mockStatic(AuthUtil.class)) {
                authMock.when(AuthUtil::getCurrentAuthPrincipal)
                        .thenReturn(new AuthPrincipal(100L, Status2FA.VERIFIED, false));

                when(itemRepository.findById(1L)).thenReturn(Optional.of(sampleItem));
                when(userRepository.findById(100L)).thenReturn(Optional.of(sampleUser));
                when(rackRepository.findById(10L)).thenReturn(Optional.of(sampleRack));
                when(assortmentRepository.findByRackId(10L)).thenReturn(Collections.emptyList());
                when(barcodeService.buildPlacementCode(anyString())).thenReturn("PLACEMENT-CODE-003");
                when(reservationRepository.findActiveReservation(eq(10L), eq(1), eq(1), any(Timestamp.class)))
                        .thenReturn(Optional.empty());

                // When
                inboundService.confirmPlacement(request, httpRequest);

                // Then – audit records should be created
                verify(inboundOperationRepository).saveAll(argThat(ops -> {
                    List<InboundOperation> list = new ArrayList<>();
                    ops.forEach(list::add);
                    assertThat(list).hasSize(1);
                    return true;
                }));
            }
        }
    }
}
