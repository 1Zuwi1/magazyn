package com.github.dawid_stolarczyk.magazyn.Services.Inventory;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.AssortmentDto;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Assortment;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Item;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Rack;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.AssortmentRepository;
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

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AssortmentServiceTest {

    @Mock
    private AssortmentRepository assortmentRepository;
    @Mock
    private Bucket4jRateLimiter rateLimiter;
    @Mock
    private HttpServletRequest request;

    @InjectMocks
    private AssortmentService assortmentService;

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
    @DisplayName("should_UpdateAssortmentMetadata_When_ExpiresAtProvided")
    void should_UpdateAssortmentMetadata_When_ExpiresAtProvided() {
        // Given
        Item item = new Item();
        item.setId(10L);

        Rack rack = new Rack();
        rack.setId(20L);

        Assortment assortment = new Assortment();
        assortment.setId(1L);
        assortment.setItem(item);
        assortment.setRack(rack);
        assortment.setCreatedAt(Timestamp.from(Instant.now().minusSeconds(3600)));
        assortment.setPositionX(1);
        assortment.setPositionY(1);

        when(assortmentRepository.findById(1L)).thenReturn(Optional.of(assortment));
        when(assortmentRepository.save(any(Assortment.class))).thenReturn(assortment);

        Timestamp newExpiry = Timestamp.from(Instant.now().plusSeconds(86400));
        AssortmentDto dto = AssortmentDto.builder()
                .expiresAt(newExpiry)
                .positionX(1)
                .positionY(1)
                .rackId(20L)
                .itemId(10L)
                .build();

        // When
        assortmentService.updateAssortmentMetadata(1L, dto, request);

        // Then
        assertThat(assortment.getExpiresAt()).isEqualTo(newExpiry);
        verify(assortmentRepository).save(assortment);
    }
}
