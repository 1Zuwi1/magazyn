package com.github.dawid_stolarczyk.magazyn.Services.Inventory;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.InboundOperationDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.OutboundOperationDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.PagedResponse;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.InboundOperation;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.OutboundOperation;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.InboundOperationRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.OutboundOperationRepository;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import com.github.dawid_stolarczyk.magazyn.Utils.InternetUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuditServiceTest {

    @Mock
    private InboundOperationRepository inboundRepository;
    @Mock
    private OutboundOperationRepository outboundRepository;
    @Mock
    private Bucket4jRateLimiter rateLimiter;
    @Mock
    private HttpServletRequest request;

    @InjectMocks
    private InboundAuditService inboundAuditService;
    @InjectMocks
    private OutboundAuditService outboundAuditService;

    private MockedStatic<InternetUtils> mockedInternetUtils;

    @BeforeEach
    void setUp() {
        mockedInternetUtils = mockStatic(InternetUtils.class);
        mockedInternetUtils.when(() -> InternetUtils.getClientIp(any())).thenReturn("127.0.0.1");
    }

    @AfterEach
    void tearDown() {
        mockedInternetUtils.close();
    }

    @Test
    @DisplayName("should_FindInboundOperations_When_Called")
    void should_FindInboundOperations_When_Called() {
        // Given
        InboundOperation op = new InboundOperation();
        op.setId(1L);
        op.setItemName("Test Item");
        op.setOperationTimestamp(Timestamp.from(Instant.now()));

        Page<InboundOperation> page = new PageImpl<>(List.of(op));
        when(inboundRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        // When
        PagedResponse<InboundOperationDto> response = inboundAuditService.getOperations(null, null, null, null, null,
                request, Pageable.unpaged());

        // Then
        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getItemName()).isEqualTo("Test Item");
    }

    @Test
    @DisplayName("should_FindOutboundOperations_When_Called")
    void should_FindOutboundOperations_When_Called() {
        // Given
        OutboundOperation op = new OutboundOperation();
        op.setId(2L);
        op.setItemName("Outbound Item");
        op.setOperationTimestamp(Timestamp.from(Instant.now()));

        Page<OutboundOperation> page = new PageImpl<>(List.of(op));
        when(outboundRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        // When
        PagedResponse<OutboundOperationDto> response = outboundAuditService.getOperations(null, null, null, null, null,
                request, Pageable.unpaged());

        // Then
        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getItemName()).isEqualTo("Outbound Item");
    }
}
