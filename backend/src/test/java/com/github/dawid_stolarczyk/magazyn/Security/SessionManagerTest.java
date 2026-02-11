package com.github.dawid_stolarczyk.magazyn.Security;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.Status2FA;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.Entity.SessionData;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.Redis.SessionService;
import com.github.dawid_stolarczyk.magazyn.Utils.CookiesUtils;
import com.github.dawid_stolarczyk.magazyn.Utils.InternetUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionManagerTest {

    @Mock
    private SessionService sessionService;
    @Mock
    private HttpServletRequest request;
    @Mock
    private HttpServletResponse response;
    @Mock
    private HttpSession session;

    @InjectMocks
    private SessionManager sessionManager;

    private MockedStatic<CookiesUtils> mockedCookiesUtils;
    private MockedStatic<InternetUtils> mockedInternetUtils;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        mockedCookiesUtils = mockStatic(CookiesUtils.class);
        mockedInternetUtils = mockStatic(InternetUtils.class);

        sampleUser = new User();
        sampleUser.setId(100L);
        sampleUser.setEmail("test@test.com");

        mockedInternetUtils.when(() -> InternetUtils.getClientIp(any())).thenReturn("127.0.0.1");
        when(request.getSession()).thenReturn(session);
    }

    @AfterEach
    void tearDown() {
        mockedCookiesUtils.close();
        mockedInternetUtils.close();
    }

    @Test
    @DisplayName("should_CreateLoginSession_When_NormalLogin")
    void should_CreateLoginSession_When_NormalLogin() {
        // Given
        when(sessionService.createSession(any(SessionData.class))).thenReturn("token123");

        // When
        sessionManager.createSuccessLoginSession(sampleUser, request, response, false, false);

        // Then
        mockedCookiesUtils.verify(() -> CookiesUtils.setCookie(eq(response), eq("SESSION"), eq("token123"), isNull()));
        verify(sessionService).createSession(argThat(data ->
                data.getUserId().equals(100L) && data.getStatus2FA() == Status2FA.PRE_2FA
        ));
    }

    @Test
    @DisplayName("should_CreatePasskeySession_When_PasskeyUsed")
    void should_CreatePasskeySession_When_PasskeyUsed() {
        // Given
        when(sessionService.createSession(any(SessionData.class))).thenReturn("token123");
        when(sessionService.create2faAuth(any())).thenReturn("2fa_token");

        // When
        sessionManager.createSuccessLoginSession(sampleUser, request, response, false, true);

        // Then
        verify(sessionService).createSession(argThat(data -> data.getStatus2FA() == Status2FA.VERIFIED));
        mockedCookiesUtils.verify(() -> CookiesUtils.setCookie(eq(response), eq("2FA_AUTH"), eq("2fa_token"), anyLong()));
    }

    @Test
    @DisplayName("should_LogoutUser_When_LogoutCalled")
    void should_LogoutUser_When_LogoutCalled() {
        // When
        sessionManager.logoutUser(response, request);

        // Then
        verify(sessionService).deleteSessionsCookies(response);
    }
}
