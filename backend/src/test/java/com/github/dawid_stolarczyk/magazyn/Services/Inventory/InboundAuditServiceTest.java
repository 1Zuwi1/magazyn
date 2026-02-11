package com.github.dawid_stolarczyk.magazyn.Services.Inventory;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.InboundOperationDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.PagedResponse;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.InboundOperation;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.InboundOperationRepository;
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
class InboundAuditServiceTest {

    @Mock
    private InboundOperationRepository inboundOperationRepository;
    @Mock
    private Bucket4jRateLimiter rateLimiter;
    @Mock
    private HttpServletRequest httpRequest;

    @InjectMocks
    private InboundAuditService inboundAuditService;

    private InboundOperation sampleOperation;

    @BeforeEach
    void setUp() {
        sampleOperation = new InboundOperation();
        sampleOperation.setId(1L);
        sampleOperation.setItemName("Test Item");
        sampleOperation.setItemCode("0112345678901234");
        sampleOperation.setRackMarker("A-01-01");
        sampleOperation.setReceivedByName("Jan Kowalski");
        sampleOperation.setOperationTimestamp(Timestamp.from(Instant.now()));
        sampleOperation.setPositionX(1);
        sampleOperation.setPositionY(2);
        sampleOperation.setQuantity(1);
        sampleOperation.setAssortmentCode("11020126010000000000123421012345");
    }

    @Test
    @DisplayName("should_ReturnPagedResponse_When_NoFilters")
    @SuppressWarnings("unchecked")
    void should_ReturnPagedResponse_When_NoFilters() {
        Page<InboundOperation> page = new PageImpl<>(List.of(sampleOperation), PageRequest.of(0, 10), 1);
        when(inboundOperationRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        PagedResponse<InboundOperationDto> result = inboundAuditService.getOperations(
                null, null, null, null, null, httpRequest, PageRequest.of(0, 10));

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getItemName()).isEqualTo("Test Item");
        assertThat(result.getContent().get(0).getRackMarker()).isEqualTo("A-01-01");
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.isFirst()).isTrue();
        assertThat(result.isLast()).isTrue();
    }

    @Test
    @DisplayName("should_ReturnEmptyResponse_When_NoOperationsFound")
    @SuppressWarnings("unchecked")
    void should_ReturnEmptyResponse_When_NoOperationsFound() {
        Page<InboundOperation> emptyPage = new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 10), 0);
        when(inboundOperationRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(emptyPage);

        PagedResponse<InboundOperationDto> result = inboundAuditService.getOperations(
                1L, 2L, 3L, null, null, httpRequest, PageRequest.of(0, 10));

        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isZero();
    }

    @Test
    @DisplayName("should_ReturnPagedResponse_When_DateRangeFilter")
    @SuppressWarnings("unchecked")
    void should_ReturnPagedResponse_When_DateRangeFilter() {
        Page<InboundOperation> page = new PageImpl<>(List.of(sampleOperation), PageRequest.of(0, 10), 1);
        when(inboundOperationRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        Timestamp start = Timestamp.from(Instant.now().minusSeconds(86400));
        Timestamp end = Timestamp.from(Instant.now());

        PagedResponse<InboundOperationDto> result = inboundAuditService.getOperations(
                null, null, null, start, end, httpRequest, PageRequest.of(0, 10));

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getPage()).isZero();
        assertThat(result.getSize()).isEqualTo(10);
    }

    @Test
    @DisplayName("should_MapFieldsCorrectly_When_ReturningDto")
    @SuppressWarnings("unchecked")
    void should_MapFieldsCorrectly_When_ReturningDto() {
        Page<InboundOperation> page = new PageImpl<>(List.of(sampleOperation), PageRequest.of(0, 10), 1);
        when(inboundOperationRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        PagedResponse<InboundOperationDto> result = inboundAuditService.getOperations(
                null, null, null, null, null, httpRequest, PageRequest.of(0, 10));

        InboundOperationDto dto = result.getContent().get(0);
        assertThat(dto.getId()).isEqualTo(1L);
        assertThat(dto.getReceivedByName()).isEqualTo("Jan Kowalski");
        assertThat(dto.getPositionX()).isEqualTo(1);
        assertThat(dto.getPositionY()).isEqualTo(2);
        assertThat(dto.getQuantity()).isEqualTo(1);
        assertThat(dto.getAssortmentCode()).isEqualTo("11020126010000000000123421012345");
        assertThat(dto.getOperationTimestamp()).isNotBlank();
    }
}
