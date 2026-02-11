package com.github.dawid_stolarczyk.magazyn.Services.Inventory;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.OutboundOperationDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.PagedResponse;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.OutboundOperation;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.OutboundOperationRepository;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OutboundAuditServiceTest {

    @Mock
    private OutboundOperationRepository outboundOperationRepository;
    @Mock
    private Bucket4jRateLimiter rateLimiter;
    @Mock
    private HttpServletRequest httpRequest;

    @InjectMocks
    private OutboundAuditService outboundAuditService;

    private OutboundOperation sampleOperation;

    @BeforeEach
    void setUp() {
        sampleOperation = new OutboundOperation();
        sampleOperation.setId(1L);
        sampleOperation.setItemName("Test Item");
        sampleOperation.setItemCode("0112345678901234");
        sampleOperation.setRackMarker("B-02-03");
        sampleOperation.setIssuedByName("Anna Nowak");
        sampleOperation.setOperationTimestamp(Timestamp.from(Instant.now()));
        sampleOperation.setPositionX(3);
        sampleOperation.setPositionY(4);
        sampleOperation.setQuantity(2);
        sampleOperation.setAssortmentCode("11020126010000000000123421099999");
        sampleOperation.setFifoCompliant(true);
    }

    @Test
    @DisplayName("should_ReturnPagedResponse_When_NoFilters")
    @SuppressWarnings("unchecked")
    void should_ReturnPagedResponse_When_NoFilters() {
        Page<OutboundOperation> page = new PageImpl<>(List.of(sampleOperation), PageRequest.of(0, 10), 1);
        when(outboundOperationRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        PagedResponse<OutboundOperationDto> result = outboundAuditService.getOperations(
                null, null, null, null, null, httpRequest, PageRequest.of(0, 10));

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getItemName()).isEqualTo("Test Item");
        assertThat(result.getContent().get(0).isFifoCompliant()).isTrue();
        assertThat(result.getTotalElements()).isEqualTo(1);
    }

    @Test
    @DisplayName("should_ReturnEmptyResponse_When_NoOperationsFound")
    @SuppressWarnings("unchecked")
    void should_ReturnEmptyResponse_When_NoOperationsFound() {
        Page<OutboundOperation> emptyPage = new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 10), 0);
        when(outboundOperationRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(emptyPage);

        PagedResponse<OutboundOperationDto> result = outboundAuditService.getOperations(
                1L, 2L, 3L, null, null, httpRequest, PageRequest.of(0, 10));

        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isZero();
    }

    @Test
    @DisplayName("should_ReturnPagedResponse_When_DateRangeFilter")
    @SuppressWarnings("unchecked")
    void should_ReturnPagedResponse_When_DateRangeFilter() {
        Page<OutboundOperation> page = new PageImpl<>(List.of(sampleOperation), PageRequest.of(0, 10), 1);
        when(outboundOperationRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        Timestamp start = Timestamp.from(Instant.now().minusSeconds(86400));
        Timestamp end = Timestamp.from(Instant.now());

        PagedResponse<OutboundOperationDto> result = outboundAuditService.getOperations(
                null, null, null, start, end, httpRequest, PageRequest.of(0, 10));

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    @DisplayName("should_MapFieldsCorrectly_When_ReturningDto")
    @SuppressWarnings("unchecked")
    void should_MapFieldsCorrectly_When_ReturningDto() {
        Page<OutboundOperation> page = new PageImpl<>(List.of(sampleOperation), PageRequest.of(0, 10), 1);
        when(outboundOperationRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        PagedResponse<OutboundOperationDto> result = outboundAuditService.getOperations(
                null, null, null, null, null, httpRequest, PageRequest.of(0, 10));

        OutboundOperationDto dto = result.getContent().get(0);
        assertThat(dto.getId()).isEqualTo(1L);
        assertThat(dto.getIssuedByName()).isEqualTo("Anna Nowak");
        assertThat(dto.getPositionX()).isEqualTo(3);
        assertThat(dto.getPositionY()).isEqualTo(4);
        assertThat(dto.getQuantity()).isEqualTo(2);
        assertThat(dto.getAssortmentCode()).isEqualTo("11020126010000000000123421099999");
        assertThat(dto.isFifoCompliant()).isTrue();
        assertThat(dto.getOperationTimestamp()).isNotBlank();
    }
}
