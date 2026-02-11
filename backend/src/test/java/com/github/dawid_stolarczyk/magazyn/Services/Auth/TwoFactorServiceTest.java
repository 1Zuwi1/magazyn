package com.github.dawid_stolarczyk.magazyn.Services.Auth;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.TwoFactorMethodsResponse;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.UserRepository;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.AuthUtil;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.Entity.AuthPrincipal;
import com.github.dawid_stolarczyk.magazyn.Security.SessionManager;
import com.github.dawid_stolarczyk.magazyn.Services.EmailService;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import com.github.dawid_stolarczyk.magazyn.Utils.InternetUtils;
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

import java.util.ArrayList;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TwoFactorServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private EmailService emailService;
    @Mock
    private SessionManager sessionManager;
    @Mock
    private Bucket4jRateLimiter rateLimiter;
    @Mock
    private HttpServletRequest request;
    @Mock
    private HttpServletResponse response;

    @InjectMocks
    private TwoFactorService twoFactorService;

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
        sampleUser.setEmail("test@test.com");
        sampleUser.setTwoFactorMethods(new ArrayList<>());
        sampleUser.setWebAuthnCredentials(new ArrayList<>());
        sampleUser.setBackupCodes(new ArrayList<>());

        // userId, status2FA, sudoMode
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
    @DisplayName("should_GetTwoFactorMethods_When_Valid")
    void should_GetTwoFactorMethods_When_Valid() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));

        TwoFactorMethodsResponse res = twoFactorService.getUsersTwoFactorMethods(request);

        assertThat(res.getMethods()).contains("EMAIL");
    }

    @Test
    @DisplayName("should_SendTwoFactorCode_When_Valid")
    void should_SendTwoFactorCode_When_Valid() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));

        twoFactorService.sendTwoFactorCodeViaEmail(request);

        verify(emailService).sendTwoFactorCode(eq("test@test.com"), anyString());
        verify(userRepository).save(sampleUser);
    }
}
