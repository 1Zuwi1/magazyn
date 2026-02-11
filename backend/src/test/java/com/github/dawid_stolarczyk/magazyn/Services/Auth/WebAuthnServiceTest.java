package com.github.dawid_stolarczyk.magazyn.Services.Auth;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.UserRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.WebAuthRepository;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.AuthUtil;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.Entity.AuthPrincipal;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.Redis.RedisWebAuthSessionService;
import com.github.dawid_stolarczyk.magazyn.Security.SessionManager;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import com.yubico.webauthn.RelyingParty;
import com.yubico.webauthn.data.PublicKeyCredentialCreationOptions;
import com.yubico.webauthn.data.PublicKeyCredentialRequestOptions;
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

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WebAuthnServiceTest {

    @Mock
    private RelyingParty relyingParty;
    @Mock
    private WebAuthRepository webAuthRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private RedisWebAuthSessionService redisService;
    @Mock
    private SessionManager sessionManager;
    @Mock
    private Bucket4jRateLimiter rateLimiter;
    @Mock
    private HttpServletRequest request;
    @Mock
    private HttpServletResponse response;

    @InjectMocks
    private WebAuthnService webAuthnService;

    private MockedStatic<AuthUtil> mockedAuthUtil;
    private User sampleUser;
    private AuthPrincipal samplePrincipal;

    @BeforeEach
    void setUp() {
        mockedAuthUtil = mockStatic(AuthUtil.class);

        sampleUser = new User();
        sampleUser.setId(1L);
        sampleUser.setUserHandle("user-handle");
        sampleUser.setEmail("test@test.com");
        sampleUser.setStatus(com.github.dawid_stolarczyk.magazyn.Model.Enums.AccountStatus.ACTIVE);

        // userId, status2FA, sudoMode
        samplePrincipal = new AuthPrincipal(1L, com.github.dawid_stolarczyk.magazyn.Model.Enums.Status2FA.VERIFIED,
                true);
        mockedAuthUtil.when(AuthUtil::getCurrentAuthPrincipal).thenReturn(samplePrincipal);
    }

    @AfterEach
    void tearDown() {
        mockedAuthUtil.close();
    }

    @Test
    @DisplayName("should_StartRegistration_When_Valid")
    void should_StartRegistration_When_Valid() throws Exception {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(relyingParty.startRegistration(any())).thenReturn(mock(PublicKeyCredentialCreationOptions.class));

        PublicKeyCredentialCreationOptions options = webAuthnService.startRegistration(request);

        assertThat(options).isNotNull();
        verify(redisService).saveRegistrationRequest(anyString(), any());
    }

    @Test
    @DisplayName("should_StartAssertion_When_Valid")
    void should_StartAssertion_When_Valid() throws Exception {
        com.yubico.webauthn.AssertionRequest assertionRequest = mock(com.yubico.webauthn.AssertionRequest.class);
        PublicKeyCredentialRequestOptions mockOptions = mock(PublicKeyCredentialRequestOptions.class);
        com.yubico.webauthn.data.ByteArray mockChallenge = mock(com.yubico.webauthn.data.ByteArray.class);

        when(relyingParty.startAssertion(any())).thenReturn(assertionRequest);
        when(assertionRequest.getPublicKeyCredentialRequestOptions()).thenReturn(mockOptions);
        when(mockOptions.getChallenge()).thenReturn(mockChallenge);
        when(mockChallenge.getBase64Url()).thenReturn("challenge");

        PublicKeyCredentialRequestOptions options = webAuthnService.startAssertion(request);

        assertThat(options).isNotNull();
        verify(redisService).saveAssertionRequest(eq("challenge"), eq(assertionRequest));
    }
}
