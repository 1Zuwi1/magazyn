package com.github.dawid_stolarczyk.magazyn.Services.Alerts;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.Alert;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Rack;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.UserNotification;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AlertType;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.UserNotificationRepository;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.AuthUtil;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.Entity.AuthPrincipal;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
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

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserNotificationServiceTest {

    @Mock
    private UserNotificationRepository notificationRepository;
    @Mock
    private Bucket4jRateLimiter rateLimiter;
    @Mock
    private HttpServletRequest request;

    @InjectMocks
    private UserNotificationService userNotificationService;

    private MockedStatic<AuthUtil> mockedAuthUtil;
    private User sampleUser;
    private AuthPrincipal samplePrincipal;

    @BeforeEach
    void setUp() {
        mockedAuthUtil = mockStatic(AuthUtil.class);

        sampleUser = new User();
        sampleUser.setId(1L);

        samplePrincipal = new AuthPrincipal(1L, null, true);
        mockedAuthUtil.when(AuthUtil::getCurrentAuthPrincipal).thenReturn(samplePrincipal);
    }

    @AfterEach
    void tearDown() {
        mockedAuthUtil.close();
    }

    @Test
    @DisplayName("should_MarkAsRead_When_OwnerCalled")
    void should_MarkAsRead_When_OwnerCalled() {
        // Given
        Rack rack = new Rack();
        rack.setMarker("R-10");

        Alert alert = new Alert();
        alert.setAlertType(AlertType.TEMPERATURE_TOO_HIGH);
        alert.setRack(rack);

        UserNotification notification = new UserNotification();
        notification.setId(500L);
        notification.setUser(sampleUser);
        notification.setAlert(alert);
        notification.setRead(false);

        when(notificationRepository.findById(500L)).thenReturn(Optional.of(notification));

        // When
        userNotificationService.markAsRead(500L, request);

        // Then
        assertThat(notification.isRead()).isTrue();
        verify(notificationRepository).save(notification);
    }
}
