package com.github.dawid_stolarczyk.magazyn.Services;

import com.github.dawid_stolarczyk.magazyn.Common.Enums.AuthError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.LoginRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.RegisterRequest;
import com.github.dawid_stolarczyk.magazyn.Exception.AuthenticationException;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.EmailVerification;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.TwoFactorMethod;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AccountStatus;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.TwoFactor;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.UserRole;
import com.github.dawid_stolarczyk.magazyn.Repositories.EmailVerificationRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.UserRepository;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.Redis.SessionService;
import com.github.dawid_stolarczyk.magazyn.Security.SessionManager;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.RateLimitOperation;
import com.github.dawid_stolarczyk.magazyn.Utils.CookiesUtils;
import com.github.dawid_stolarczyk.magazyn.Utils.Hasher;
import com.yubico.webauthn.data.ByteArray;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.UUID;

import static com.github.dawid_stolarczyk.magazyn.Utils.InternetUtils.getClientIp;

@Service
public class AuthService {
    private final Bucket4jRateLimiter rateLimiter;
    private final UserRepository userRepository;
    private final SessionService sessionService;
    private final EmailVerificationRepository emailVerificationRepository;
    private final EmailService emailService;
    private final SessionManager sessionManager;

    @Value("${auth.password.min-length}")
    private int MIN_PASSWORD_LENGTH;

    @Value("${app.domain}")
    private String domain;

    public AuthService(Bucket4jRateLimiter rateLimiter, UserRepository userRepository, SessionService sessionService, EmailVerificationRepository emailVerificationRepository, EmailService emailService, SessionManager sessionManager) {
        this.rateLimiter = rateLimiter;
        this.userRepository = userRepository;
        this.sessionService = sessionService;
        this.emailVerificationRepository = emailVerificationRepository;
        this.emailService = emailService;
        this.sessionManager = sessionManager;
    }

    public void logoutUser(HttpServletResponse response, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.AUTH_LOGOUT);
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            new SecurityContextLogoutHandler().logout(request, response, auth);
        }

        String sessionId = CookiesUtils.getCookie(request, "SESSION");
        String rememberMeId = CookiesUtils.getCookie(request, "REMEMBER_ME");

        if (sessionId != null) {
            sessionService.deleteSession(sessionId);
        }
        if (rememberMeId != null) {
            sessionService.deleteRemember(rememberMeId);
        }

        sessionService.deleteSessionsCookies(response);
    }

    public void loginUser(LoginRequest loginRequest, HttpServletResponse response, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.AUTH_LOGIN);

        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new AuthenticationException(AuthError.INVALID_CREDENTIALS.name()));
        if (!BCrypt.checkpw(loginRequest.getPassword(), user.getPassword())) {
            throw new AuthenticationException(AuthError.INVALID_CREDENTIALS.name());
        }

        if (!user.getStatus().equals(AccountStatus.ACTIVE)) {
            throw new AuthenticationException(AuthError.ACCOUNT_LOCKED.name());
        }

        sessionManager.createSuccessLoginSession(user, request, response, loginRequest.isRememberMe());
    }

    @Transactional
    public void registerUser(RegisterRequest registerRequest, HttpServletRequest request) throws AuthenticationException {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.AUTH_REGISTER);

        if (userRepository.findByEmail(registerRequest.getEmail()).isPresent()) {
            throw new AuthenticationException(AuthError.EMAIL_TAKEN.name());
        }
        if (!checkPasswordStrength(registerRequest.getPassword())) {
            throw new AuthenticationException(AuthError.WEAK_PASSWORD.name());
        }
        User newUser = new User();
        newUser.setEmail(registerRequest.getEmail());
        newUser.setRawPassword(registerRequest.getPassword());
        newUser.setFullName(registerRequest.getFullName());
        newUser.setRole(UserRole.USER);
        newUser.setStatus(AccountStatus.PENDING_VERIFICATION);
        newUser.addTwoFactorMethod(new TwoFactorMethod(TwoFactor.EMAIL));
        newUser.setUserHandle(new ByteArray(UUID.randomUUID().toString()
                .getBytes(StandardCharsets.UTF_8))
                .getBase64Url());

        EmailVerification emailVerification = new EmailVerification();
        String emailVerificationToken = UUID.randomUUID().toString();
        emailVerification.setVerificationToken(Hasher.hashSHA256(emailVerificationToken));
        emailVerification.setExpiresAt(Instant.now().plus(15, java.time.temporal.ChronoUnit.MINUTES));
        newUser.setEmailVerifications(emailVerification);
        userRepository.save(newUser);

        emailService.sendVerificationEmail(newUser.getEmail(), "http://%s/api/auth/verify-email?token=%s".formatted(domain, emailVerificationToken));
    }

    public void verifyEmailCheck(String token, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.AUTH_FREE);
        EmailVerification emailVerification = emailVerificationRepository.findByVerificationToken(Hasher.hashSHA256(token)).orElseThrow(()
                -> new AuthenticationException(AuthError.TOKEN_INVALID.name()));

        if (emailVerification.getExpiresAt().isBefore(Instant.now())) {
            throw new AuthenticationException(AuthError.TOKEN_EXPIRED.name());
        }
        User user = emailVerification.getUser();
        user.removeEmailVerifications();
        user.setStatus(AccountStatus.ACTIVE);
        userRepository.save(user);
    }

    private boolean checkPasswordStrength(String password) {
        if (password == null)
            return false;

        password = password.trim();

        if (password.length() < MIN_PASSWORD_LENGTH)
            return false;

        boolean hasUpper = false;
        boolean hasLower = false;
        boolean hasDigit = false;
        boolean hasSpecial = false;

        for (char c : password.toCharArray()) {
            if (Character.isUpperCase(c)) {
                hasUpper = true;
            } else if (Character.isLowerCase(c)) {
                hasLower = true;
            } else if (Character.isDigit(c)) {
                hasDigit = true;
            } else if (!Character.isLetterOrDigit(c)) {
                hasSpecial = true;
            }
        }

        return hasUpper && hasLower && hasDigit && hasSpecial;
    }
}
