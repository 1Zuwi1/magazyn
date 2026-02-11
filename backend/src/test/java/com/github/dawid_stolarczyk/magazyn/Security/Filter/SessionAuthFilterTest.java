package com.github.dawid_stolarczyk.magazyn.Security.Filter;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AccountStatus;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.EmailStatus;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.Status2FA;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.UserRepository;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.Entity.RememberMeData;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.Entity.SessionData;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.Redis.SessionService;
import com.github.dawid_stolarczyk.magazyn.Security.SessionManager;
import com.github.dawid_stolarczyk.magazyn.Utils.CookiesUtils;
import com.github.dawid_stolarczyk.magazyn.Utils.InternetUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SessionAuthFilterTest {

    @Mock
    private SessionService sessionService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private SessionManager sessionManager;
    @Mock
    private HttpServletRequest request;
    @Mock
    private HttpServletResponse response;
    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private SessionAuthFilter sessionAuthFilter;

    private MockedStatic<CookiesUtils> mockedCookiesUtils;
    private MockedStatic<InternetUtils> mockedInternetUtils;
    private User sampleUser;
    private RememberMeData rememberMeData;

    @BeforeEach
    void setUp() {
        mockedCookiesUtils = mockStatic(CookiesUtils.class);
        mockedInternetUtils = mockStatic(InternetUtils.class);

        sampleUser = new User();
        sampleUser.setId(1L);
        sampleUser.setEmail("test@test.com");
        sampleUser.setStatus(AccountStatus.ACTIVE);
        sampleUser.setEmailStatus(EmailStatus.VERIFIED);

        rememberMeData = new RememberMeData();
        rememberMeData.setId("remember123");
        rememberMeData.setUserId(1L);
        rememberMeData.setStatus2FA(Status2FA.VERIFIED);

        mockedInternetUtils.when(() -> InternetUtils.getClientIp(any())).thenReturn("127.0.0.1");
        when(request.getHeader("User-Agent")).thenReturn("test-agent");
    }

    @AfterEach
    void tearDown() {
        mockedCookiesUtils.close();
        mockedInternetUtils.close();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("should_AuthenticateViaRememberMe_When_SessionExpired")
    void should_AuthenticateViaRememberMe_When_SessionExpired() throws Exception {
        mockedCookiesUtils.when(() -> CookiesUtils.getCookie(request, "SESSION")).thenReturn("session123");
        mockedCookiesUtils.when(() -> CookiesUtils.getCookie(request, "REMEMBER_ME")).thenReturn("remember123");

        when(sessionService.getSession("session123")).thenReturn(Optional.empty());
        when(sessionService.getRememberMeSession("remember123")).thenReturn(Optional.of(rememberMeData));
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(sessionService.createSession(any(SessionData.class))).thenReturn("new-session456");

        sessionAuthFilter.doFilterInternal(request, response, filterChain);

        verify(sessionService).createSession(any(SessionData.class));
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("should_AuthenticateViaRememberMe_When_NoSessionCookie")
    void should_AuthenticateViaRememberMe_When_NoSessionCookie() throws Exception {
        mockedCookiesUtils.when(() -> CookiesUtils.getCookie(request, "SESSION")).thenReturn(null);
        mockedCookiesUtils.when(() -> CookiesUtils.getCookie(request, "REMEMBER_ME")).thenReturn("remember123");

        when(sessionService.getRememberMeSession("remember123")).thenReturn(Optional.of(rememberMeData));
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(sessionService.createSession(any(SessionData.class))).thenReturn("new-session456");

        sessionAuthFilter.doFilterInternal(request, response, filterChain);

        verify(sessionService).createSession(any(SessionData.class));
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("should_Logout_When_RememberMeTokenNotFound")
    void should_Logout_When_RememberMeTokenNotFound() throws Exception {
        mockedCookiesUtils.when(() -> CookiesUtils.getCookie(request, "SESSION")).thenReturn(null);
        mockedCookiesUtils.when(() -> CookiesUtils.getCookie(request, "REMEMBER_ME")).thenReturn("invalid-remember");

        when(sessionService.getRememberMeSession("invalid-remember")).thenReturn(Optional.empty());

        sessionAuthFilter.doFilterInternal(request, response, filterChain);

        verify(sessionManager).logoutUser(response, request);
        verify(filterChain).doFilter(request, response);
    }
}
