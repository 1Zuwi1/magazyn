package com.github.dawid_stolarczyk.magazyn.Services.Alerts;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.AlertStatusUpdateRequest;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Alert;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Rack;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Warehouse;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AlertStatus;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AlertType;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.AlertRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.UserRepository;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.AuthUtil;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.Entity.AuthPrincipal;
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

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AlertServiceTest {

    @Mock
    private AlertRepository alertRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private Bucket4jRateLimiter rateLimiter;
    @Mock
    private HttpServletRequest request;

    @InjectMocks
    private AlertService alertService;

    private MockedStatic<AuthUtil> mockedAuthUtil;
    private MockedStatic<InternetUtils> mockedInternetUtils;
    private User sampleUser;
    private AuthPrincipal samplePrincipal;

    @BeforeEach
    void setUp() {
        mockedAuthUtil = mockStatic(AuthUtil.class);
        mockedInternetUtils = mockStatic(InternetUtils.class);
        mockedInternetUtils.when(() -> InternetUtils.getClientIp(any())).thenReturn("127.0.0.1");

        sampleUser = new User();
        sampleUser.setId(1L);
        sampleUser.setFullName("Admin User");

        samplePrincipal = new AuthPrincipal(1L, com.github.dawid_stolarczyk.magazyn.Model.Enums.Status2FA.PRE_2FA,
                true);
        mockedAuthUtil.when(AuthUtil::getCurrentAuthPrincipal).thenReturn(samplePrincipal);
    }

    @AfterEach
    void tearDown() {
        mockedAuthUtil.close();
        mockedInternetUtils.close();
    }

    @Test
    @DisplayName("should_UpdateAlertStatusToResolved_When_Valid")
    void should_UpdateAlertStatusToResolved_When_Valid() {
        // Given
        Warehouse warehouse = new Warehouse();
        warehouse.setId(5L);
        warehouse.setName("Main WH");

        Rack rack = new Rack();
        rack.setId(50L);
        rack.setMarker("R-01");

        Alert alert = spy(new Alert());
        alert.setId(100L);
        alert.setStatus(AlertStatus.OPEN);
        alert.setAlertType(AlertType.TEMPERATURE_TOO_HIGH);
        alert.setWarehouse(warehouse);
        alert.setRack(rack);
        alert.setCreatedAt(Instant.now());

        when(alertRepository.findById(100L)).thenReturn(Optional.of(alert));
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(alertRepository.save(any(Alert.class))).thenReturn(alert);

        AlertStatusUpdateRequest req = new AlertStatusUpdateRequest();
        req.setAlertIds(List.of(100L));
        req.setStatus(AlertStatus.RESOLVED);
        req.setResolutionNotes("Fixed sensor");

        // When
        alertService.updateAlertStatus(100L, req, request);

        // Then
        assertThat(alert.getStatus()).isEqualTo(AlertStatus.RESOLVED);
        assertThat(alert.getResolutionNotes()).isEqualTo("Fixed sensor");
        verify(alertRepository).save(alert);
    }
}
