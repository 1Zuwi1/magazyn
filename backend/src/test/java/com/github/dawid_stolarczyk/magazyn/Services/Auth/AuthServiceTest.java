package com.github.dawid_stolarczyk.magazyn.Services.Auth;

import com.github.dawid_stolarczyk.magazyn.Common.Enums.AuthError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.LoginRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.RegisterRequest;
import com.github.dawid_stolarczyk.magazyn.Exception.AuthenticationException;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AccountStatus;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.EmailStatus;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.UserRepository;
import com.github.dawid_stolarczyk.magazyn.Security.SessionManager;
import com.github.dawid_stolarczyk.magazyn.Services.EmailService;
import com.github.dawid_stolarczyk.magazyn.Services.GeolocationService;
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
import org.springframework.security.crypto.bcrypt.BCrypt;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private Bucket4jRateLimiter rateLimiter;
    @Mock
    private UserRepository userRepository;
    @Mock
    private SessionManager sessionManager;
    @Mock
    private EmailService emailService;
    @Mock
    private GeolocationService geolocationService;
    @Mock
    private HttpServletRequest request;
    @Mock
    private HttpServletResponse response;

    @InjectMocks
    private AuthService authService;

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
    @DisplayName("should_LoginUser_When_CredentialsAreValid")
    void should_LoginUser_When_CredentialsAreValid() {
        // Given
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("test@test.com");
        loginRequest.setPassword("password123");

        User user = new User();
        user.setEmail("test@test.com");
        user.setPassword(BCrypt.hashpw("password123", BCrypt.gensalt()));
        user.setStatus(AccountStatus.ACTIVE);
        user.setEmailStatus(EmailStatus.VERIFIED);

        when(userRepository.findByEmail("test@test.com")).thenReturn(Optional.of(user));

        // When
        authService.loginUser(loginRequest, response, request);

        // Then
        verify(sessionManager).createSuccessLoginSession(eq(user), eq(request), eq(response), anyBoolean(), eq(false));
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("should_ThrowException_When_LoginWithInvalidCredentials")
    void should_ThrowException_When_LoginWithInvalidCredentials() {
        // Given
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("test@test.com");
        loginRequest.setPassword("wrong-password");

        User user = new User();
        user.setEmail("test@test.com");
        user.setPassword(BCrypt.hashpw("password123", BCrypt.gensalt()));

        when(userRepository.findByEmail("test@test.com")).thenReturn(Optional.of(user));

        // When & Then
        assertThatThrownBy(() -> authService.loginUser(loginRequest, response, request))
                .isInstanceOf(AuthenticationException.class)
                .hasMessage(AuthError.INVALID_CREDENTIALS.name());
    }

    @Test
    @DisplayName("should_RegisterUser_When_DataIsValid")
    void should_RegisterUser_When_DataIsValid() {
        // Given
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail("new@test.com");
        registerRequest.setPassword("Password123!");
        registerRequest.setFullName("John Doe");
        registerRequest.setPhoneNumber("123456789");

        when(userRepository.findByEmail("new@test.com")).thenReturn(Optional.empty());
        when(userRepository.existsByPhone("123456789")).thenReturn(false);
        when(geolocationService.getLocationFromIp(anyString())).thenReturn("New York, US");

        // When
        authService.registerUser(registerRequest, request);

        // Then
        verify(userRepository).save(any(User.class));
        verify(emailService).sendVerificationEmail(eq("new@test.com"), anyString());
    }
}
