package com.github.dawid_stolarczyk.magazyn.Services.Inventory;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.*;
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
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OutboundServiceTest {

        @Mock
        private AssortmentRepository assortmentRepository;
        @Mock
        private ItemRepository itemRepository;
        @Mock
        private UserRepository userRepository;
        @Mock
        private InboundOperationRepository inboundOperationRepository;
        @Mock
        private OutboundOperationRepository outboundOperationRepository;
        @Mock
        private Bucket4jRateLimiter rateLimiter;
        @Mock
        private SmartCodeService smartCodeService;
        @Mock
        private HttpServletRequest httpRequest;

        @InjectMocks
        private OutboundService outboundService;

        private Item sampleItem;
        private Rack sampleRack;
        private User sampleUser;

    @BeforeEach
    void setUp() {
        when(httpRequest.getRemoteAddr()).thenReturn("127.0.0.1");

        sampleItem = new Item();
        sampleItem.setId(1L);
        sampleItem.setName("Test Item");
        sampleItem.setCode("0112345678901234");

        sampleRack = new Rack();
        sampleRack.setId(10L);
        sampleRack.setMarker("A-01");
        sampleRack.setSize_x(5);
        sampleRack.setSize_y(4);

        sampleUser = new User();
        sampleUser.setId(100L);
        sampleUser.setFullName("Jan Kowalski");
    }

        private Assortment buildAssortment(Long id, String code, Instant createdAt, Instant expiresAt) {
                Assortment a = new Assortment();
                a.setId(id);
                a.setCode(code);
                a.setItem(sampleItem);
                a.setRack(sampleRack);
                a.setPositionX(1);
                a.setPositionY(1);
                a.setCreatedAt(Timestamp.from(createdAt));
                if (expiresAt != null) {
                        a.setExpiresAt(Timestamp.from(expiresAt));
                }
                return a;
        }

        // ── plan ─────────────────────────────────────────────────────────

        @Nested
        @DisplayName("plan")
        class Plan {

                @Test
                void should_ReturnPickList_When_SufficientStock() {
                        // Given
                        OutboundPlanRequest request = OutboundPlanRequest.builder()
                                        .itemId(1L).quantity(2).build();

                        Assortment a1 = buildAssortment(1L, "CODE-A", Instant.now().minus(2, ChronoUnit.DAYS), null);
                        Assortment a2 = buildAssortment(2L, "CODE-B", Instant.now().minus(1, ChronoUnit.DAYS), null);

                        when(itemRepository.findById(1L)).thenReturn(Optional.of(sampleItem));
                        when(assortmentRepository.findByItemIdFifoOrdered(1L)).thenReturn(List.of(a1, a2));
                        when(assortmentRepository.findExpiredByItemId(1L)).thenReturn(Collections.emptyList());

                        // When
                        OutboundPlanResponse result = outboundService.plan(request, httpRequest);

                        // Then
                        assertThat(result.getItemId()).isEqualTo(1L);
                        assertThat(result.getItemName()).isEqualTo("Test Item");
                        assertThat(result.getRequestedQuantity()).isEqualTo(2);
                        assertThat(result.getAvailableQuantity()).isEqualTo(2L);
                        assertThat(result.getPickSlots()).hasSize(2);
                        assertThat(result.getWarning()).isNull();
                }

                @Test
                void should_ThrowException_When_ItemNotFoundForPlan() {
                        // Given
                        OutboundPlanRequest request = OutboundPlanRequest.builder()
                                        .itemId(999L).quantity(1).build();
                        when(itemRepository.findById(999L)).thenReturn(Optional.empty());

                        // When / Then
                        assertThatThrownBy(() -> outboundService.plan(request, httpRequest))
                                        .isInstanceOf(IllegalArgumentException.class)
                                        .hasMessageContaining("ITEM_NOT_FOUND");
                }

                @Test
                void should_ExcludeExpiredAssortments_When_Planning() {
                        // Given — 1 valid, 1 expired (expired handled by separate query)
                        OutboundPlanRequest request = OutboundPlanRequest.builder()
                                        .itemId(1L).quantity(5).build();

                        Assortment valid = buildAssortment(1L, "CODE-V", Instant.now().minus(1, ChronoUnit.DAYS), null);
                        Assortment expired = buildAssortment(2L, "CODE-E", Instant.now().minus(10, ChronoUnit.DAYS),
                                        Instant.now().minus(1, ChronoUnit.DAYS));

                        when(itemRepository.findById(1L)).thenReturn(Optional.of(sampleItem));
                        when(assortmentRepository.findByItemIdFifoOrdered(1L)).thenReturn(List.of(valid));
                        when(assortmentRepository.findExpiredByItemId(1L)).thenReturn(List.of(expired));

                        // When
                        OutboundPlanResponse result = outboundService.plan(request, httpRequest);

                        // Then
                        assertThat(result.getPickSlots()).hasSize(1);
                        assertThat(result.getExpiredQuantity()).isEqualTo(1L);
                        assertThat(result.getWarning()).contains("expired");
                }

                @Test
                void should_ReturnWarning_When_AllAssortmentsExpired() {
                        // Given
                        OutboundPlanRequest request = OutboundPlanRequest.builder()
                                        .itemId(1L).quantity(1).build();

                        Assortment expired = buildAssortment(1L, "CODE-E", Instant.now().minus(10, ChronoUnit.DAYS),
                                        Instant.now().minus(1, ChronoUnit.DAYS));

                        when(itemRepository.findById(1L)).thenReturn(Optional.of(sampleItem));
                        when(assortmentRepository.findByItemIdFifoOrdered(1L)).thenReturn(Collections.emptyList());
                        when(assortmentRepository.findExpiredByItemId(1L)).thenReturn(List.of(expired));

                        // When
                        OutboundPlanResponse result = outboundService.plan(request, httpRequest);

                        // Then
                        assertThat(result.getPickSlots()).isEmpty();
                        assertThat(result.getWarning()).contains("expired");
                }
        }

        // ── check ────────────────────────────────────────────────────────

        @Nested
        @DisplayName("check")
        class Check {

                @Test
                void should_ReturnFifoCompliant_When_AssortmentIsOldest() {
                        // Given
                        OutboundPickPosition request = OutboundPickPosition.builder().code("CODE-A").build();

                        Assortment assortment = buildAssortment(1L, "CODE-A",
                                        Instant.now().minus(5, ChronoUnit.DAYS),
                                        Instant.now().plus(30, ChronoUnit.DAYS));

                        when(smartCodeService.findAssortmentBySmartCode("CODE-A")).thenReturn(assortment);
                        when(assortmentRepository.findOlderAssortments(eq(1L), any(Timestamp.class)))
                                        .thenReturn(Collections.emptyList());

                        // When
                        OutboundCheckResponse result = outboundService.check(request, httpRequest);

                        // Then
                        assertThat(result.isFifoCompliant()).isTrue();
                        assertThat(result.getOlderAssortments()).isEmpty();
                        assertThat(result.getWarning()).isNull();
                }

                @Test
                void should_ReturnNonCompliant_When_OlderAssortmentsExist() {
                        // Given
                        OutboundPickPosition request = OutboundPickPosition.builder().code("CODE-B").build();

                        Assortment requested = buildAssortment(2L, "CODE-B",
                                        Instant.now().minus(1, ChronoUnit.DAYS),
                                        Instant.now().plus(30, ChronoUnit.DAYS));

                        Assortment older = buildAssortment(1L, "CODE-A",
                                        Instant.now().minus(5, ChronoUnit.DAYS),
                                        Instant.now().plus(30, ChronoUnit.DAYS));

                        when(smartCodeService.findAssortmentBySmartCode("CODE-B")).thenReturn(requested);
                        when(assortmentRepository.findOlderAssortments(eq(1L), any(Timestamp.class)))
                                        .thenReturn(List.of(older));

                        // When
                        OutboundCheckResponse result = outboundService.check(request, httpRequest);

                        // Then
                        assertThat(result.isFifoCompliant()).isFalse();
                        assertThat(result.getOlderAssortments()).hasSize(1);
                        assertThat(result.getWarning()).contains("older");
                }
        }

        // ── execute ──────────────────────────────────────────────────────

        @Nested
        @DisplayName("execute")
        class Execute {

                @Test
                void should_ExecuteOutbound_When_FifoCompliant() {
                        // Given
                        Assortment assortment = buildAssortment(1L, "CODE-A",
                                        Instant.now().minus(5, ChronoUnit.DAYS),
                                        Instant.now().plus(30, ChronoUnit.DAYS));

                        OutboundExecuteRequest request = OutboundExecuteRequest.builder()
                                        .assortments(List.of(OutboundPickPosition.builder().code("CODE-A").build()))
                                        .skipFifo(false)
                                        .build();

                        try (MockedStatic<AuthUtil> authMock = mockStatic(AuthUtil.class)) {
                                authMock.when(AuthUtil::getCurrentAuthPrincipal)
                                                .thenReturn(new AuthPrincipal(100L, Status2FA.VERIFIED, false));

                                when(userRepository.findById(100L)).thenReturn(Optional.of(sampleUser));
                                when(assortmentRepository.findByCode("CODE-A")).thenReturn(Optional.of(assortment));
                                when(assortmentRepository.findOlderAssortments(eq(1L), any(Timestamp.class)))
                                                .thenReturn(Collections.emptyList());
                                when(outboundOperationRepository.save(any(OutboundOperation.class))).thenAnswer(inv -> {
                                        OutboundOperation op = inv.getArgument(0);
                                        op.setOperationTimestamp(Timestamp.from(Instant.now()));
                                        return op;
                                });

                                // When
                                OutboundExecuteResponse result = outboundService.execute(request, httpRequest);

                                // Then
                                assertThat(result.getIssuedCount()).isEqualTo(1);
                                assertThat(result.getOperations()).hasSize(1);
                                verify(assortmentRepository).delete(assortment);
                                verify(outboundOperationRepository).save(any(OutboundOperation.class));
                        }
                }

                @Test
                void should_ThrowFifoViolation_When_SkipFifoIsFalse() {
                        // Given
                        Assortment requested = buildAssortment(2L, "CODE-B",
                                        Instant.now().minus(1, ChronoUnit.DAYS),
                                        Instant.now().plus(30, ChronoUnit.DAYS));

                        Assortment older = buildAssortment(1L, "CODE-A",
                                        Instant.now().minus(5, ChronoUnit.DAYS), null);

                        OutboundExecuteRequest request = OutboundExecuteRequest.builder()
                                        .assortments(List.of(OutboundPickPosition.builder().code("CODE-B").build()))
                                        .skipFifo(false)
                                        .build();

                        try (MockedStatic<AuthUtil> authMock = mockStatic(AuthUtil.class)) {
                                authMock.when(AuthUtil::getCurrentAuthPrincipal)
                                                .thenReturn(new AuthPrincipal(100L, Status2FA.VERIFIED, false));

                                when(userRepository.findById(100L)).thenReturn(Optional.of(sampleUser));
                                when(assortmentRepository.findByCode("CODE-B")).thenReturn(Optional.of(requested));
                                when(assortmentRepository.findOlderAssortments(eq(1L), any(Timestamp.class)))
                                                .thenReturn(List.of(older));

                                // When / Then
                                assertThatThrownBy(() -> outboundService.execute(request, httpRequest))
                                                .isInstanceOf(IllegalArgumentException.class)
                                                .hasMessageContaining("OUTBOUND_FIFO_VIOLATION");
                        }
                }

                @Test
                void should_AllowNonFifoPick_When_SkipFifoIsTrue() {
                        // Given
                        Assortment requested = buildAssortment(2L, "CODE-B",
                                        Instant.now().minus(1, ChronoUnit.DAYS),
                                        Instant.now().plus(30, ChronoUnit.DAYS));

                        Assortment older = buildAssortment(1L, "CODE-A",
                                        Instant.now().minus(5, ChronoUnit.DAYS), null);

                        OutboundExecuteRequest request = OutboundExecuteRequest.builder()
                                        .assortments(List.of(OutboundPickPosition.builder().code("CODE-B").build()))
                                        .skipFifo(true) // skip FIFO
                                        .build();

                        try (MockedStatic<AuthUtil> authMock = mockStatic(AuthUtil.class)) {
                                authMock.when(AuthUtil::getCurrentAuthPrincipal)
                                                .thenReturn(new AuthPrincipal(100L, Status2FA.VERIFIED, false));

                                when(userRepository.findById(100L)).thenReturn(Optional.of(sampleUser));
                                when(assortmentRepository.findByCode("CODE-B")).thenReturn(Optional.of(requested));
                                when(assortmentRepository.findOlderAssortments(eq(1L), any(Timestamp.class)))
                                                .thenReturn(List.of(older));
                                when(outboundOperationRepository.save(any(OutboundOperation.class))).thenAnswer(inv -> {
                                        OutboundOperation op = inv.getArgument(0);
                                        op.setOperationTimestamp(Timestamp.from(Instant.now()));
                                        return op;
                                });

                                // When
                                OutboundExecuteResponse result = outboundService.execute(request, httpRequest);

                                // Then
                                assertThat(result.getIssuedCount()).isEqualTo(1);
                                verify(assortmentRepository).delete(requested);
                                verify(outboundOperationRepository).save(any(OutboundOperation.class));
                        }
                }

                @Test
                void should_ThrowException_When_AssortmentNotFound() {
                        // Given
                        OutboundExecuteRequest request = OutboundExecuteRequest.builder()
                                        .assortments(List
                                                        .of(OutboundPickPosition.builder().code("NONEXISTENT").build()))
                                        .build();

                        try (MockedStatic<AuthUtil> authMock = mockStatic(AuthUtil.class)) {
                                authMock.when(AuthUtil::getCurrentAuthPrincipal)
                                                .thenReturn(new AuthPrincipal(100L, Status2FA.VERIFIED, false));

                                when(userRepository.findById(100L)).thenReturn(Optional.of(sampleUser));
                                when(assortmentRepository.findByCode("NONEXISTENT")).thenReturn(Optional.empty());

                                // When / Then
                                assertThatThrownBy(() -> outboundService.execute(request, httpRequest))
                                                .isInstanceOf(IllegalArgumentException.class)
                                                .hasMessageContaining("ASSORTMENT_NOT_FOUND");
                        }
                }

                @Test
                void should_DeleteAssortment_When_Executed() {
                        // Given
                        Assortment assortment = buildAssortment(1L, "CODE-A",
                                        Instant.now().minus(5, ChronoUnit.DAYS),
                                        Instant.now().plus(30, ChronoUnit.DAYS));

                        OutboundExecuteRequest request = OutboundExecuteRequest.builder()
                                        .assortments(List.of(OutboundPickPosition.builder().code("CODE-A").build()))
                                        .skipFifo(false)
                                        .build();

                        try (MockedStatic<AuthUtil> authMock = mockStatic(AuthUtil.class)) {
                                authMock.when(AuthUtil::getCurrentAuthPrincipal)
                                                .thenReturn(new AuthPrincipal(100L, Status2FA.VERIFIED, false));

                                when(userRepository.findById(100L)).thenReturn(Optional.of(sampleUser));
                                when(assortmentRepository.findByCode("CODE-A")).thenReturn(Optional.of(assortment));
                                when(assortmentRepository.findOlderAssortments(eq(1L), any(Timestamp.class)))
                                                .thenReturn(Collections.emptyList());
                                when(outboundOperationRepository.save(any(OutboundOperation.class))).thenAnswer(inv -> {
                                        OutboundOperation op = inv.getArgument(0);
                                        op.setOperationTimestamp(Timestamp.from(Instant.now()));
                                        return op;
                                });

                                // When
                                outboundService.execute(request, httpRequest);

                                // Then
                                verify(assortmentRepository).delete(assortment);
                        }
                }

                @Test
                void should_CreateAuditRecord_When_Executed() {
                        // Given
                        Assortment assortment = buildAssortment(1L, "CODE-A",
                                        Instant.now().minus(5, ChronoUnit.DAYS),
                                        Instant.now().plus(30, ChronoUnit.DAYS));

                        OutboundExecuteRequest request = OutboundExecuteRequest.builder()
                                        .assortments(List.of(OutboundPickPosition.builder().code("CODE-A").build()))
                                        .skipFifo(false)
                                        .build();

                        try (MockedStatic<AuthUtil> authMock = mockStatic(AuthUtil.class)) {
                                authMock.when(AuthUtil::getCurrentAuthPrincipal)
                                                .thenReturn(new AuthPrincipal(100L, Status2FA.VERIFIED, false));

                                when(userRepository.findById(100L)).thenReturn(Optional.of(sampleUser));
                                when(assortmentRepository.findByCode("CODE-A")).thenReturn(Optional.of(assortment));
                                when(assortmentRepository.findOlderAssortments(eq(1L), any(Timestamp.class)))
                                                .thenReturn(Collections.emptyList());
                                when(outboundOperationRepository.save(any(OutboundOperation.class))).thenAnswer(inv -> {
                                        OutboundOperation op = inv.getArgument(0);
                                        op.setOperationTimestamp(Timestamp.from(Instant.now()));
                                        return op;
                                });

                                // When
                                outboundService.execute(request, httpRequest);

                                // Then
                                verify(outboundOperationRepository).save(argThat(op -> {
                                        assertThat(op.getRackMarker()).isEqualTo("A-01");
                                        assertThat(op.getIssuedByName()).isEqualTo("Jan Kowalski");
                                        assertThat(op.getItemCode()).isEqualTo("0112345678901234");
                                        assertThat(op.isFifoCompliant()).isTrue();
                                        return true;
                                }));
                        }
                }
        }
}
