package com.github.dawid_stolarczyk.magazyn.Services;

import com.github.dawid_stolarczyk.magazyn.Common.Enums.AuthError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.LoginRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.RegisterRequest;
import com.github.dawid_stolarczyk.magazyn.Exception.AuthenticationException;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.EmailVerification;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AccountStatus;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.Status2FA;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.UserRole;
import com.github.dawid_stolarczyk.magazyn.Repositories.EmailVerificationRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.UserRepository;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.RememberMeData;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.SessionData;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.SessionService;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.RateLimitOperation;
import com.github.dawid_stolarczyk.magazyn.Utils.CookiesUtils;
import com.github.dawid_stolarczyk.magazyn.Utils.Hasher;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static com.github.dawid_stolarczyk.magazyn.Utils.InternetUtils.getClientIp;

@Service
public class AuthService {
    @Autowired
    private Bucket4jRateLimiter rateLimiter;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private SessionService sessionService;
    @Autowired
    private EmailVerificationRepository emailVerificationRepository;
    @Autowired
    private EmailService emailService;

    @Value("${auth.password.min-length}")
    private int MIN_PASSWORD_LENGTH;

    @Value("${app.domain}")
    private String domain;

    public void logoutUser(HttpServletResponse response, HttpServletRequest request, String rt) {
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

        String sessionId = UUID.randomUUID().toString();
        SessionData sessionData = new SessionData(
                sessionId,
                user.getId(),
                Status2FA.PRE_2FA,
                getClientIp(request),
                request.getHeader("User-Agent"));

        CookiesUtils.setCookie(response, "SESSION", sessionService.createSession(sessionData), null);

        if (loginRequest.isRememberMe()) {
            RememberMeData rememberMeData = new RememberMeData(
                    UUID.randomUUID().toString(),
                    user.getId(),
                    Status2FA.PRE_2FA,
                    getClientIp(request),
                    request.getHeader("User-Agent"));

            CookiesUtils.setCookie(
                    response,
                    "REMEMBER_ME",
                    sessionService.createRememberToken(rememberMeData),
                    Duration.of(14, ChronoUnit.DAYS).getSeconds());
        }

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

        EmailVerification emailVerification = new EmailVerification();
        String emailVerificationToken = UUID.randomUUID().toString();
        emailVerification.setVerificationToken(Hasher.hashSHA256(emailVerificationToken));
        emailVerification.setExpiresAt(Instant.now().plus(15, java.time.temporal.ChronoUnit.MINUTES));
        newUser.setEmailVerifications(emailVerification);
        userRepository.save(newUser);

        String baseUrl = ServletUriComponentsBuilder.fromRequest(request)
                .path("/auth/verify-email")
                .toUriString();
        emailService.sendVerificationEmail(newUser.getEmail(), baseUrl + "?token=" + emailVerificationToken);
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
