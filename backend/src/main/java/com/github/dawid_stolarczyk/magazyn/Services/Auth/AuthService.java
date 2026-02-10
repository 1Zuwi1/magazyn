package com.github.dawid_stolarczyk.magazyn.Services.Auth;


import com.github.dawid_stolarczyk.magazyn.Common.Enums.AuthError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.LoginRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.RegisterRequest;
import com.github.dawid_stolarczyk.magazyn.Exception.AuthenticationException;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.EmailVerification;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.PasswordResetToken;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AccountStatus;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.EmailStatus;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.UserRole;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.EmailVerificationRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.PasswordResetTokenRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.UserRepository;
import com.github.dawid_stolarczyk.magazyn.Security.SessionManager;
import com.github.dawid_stolarczyk.magazyn.Services.EmailService;
import com.github.dawid_stolarczyk.magazyn.Services.GeolocationService;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.RateLimitOperation;
import com.github.dawid_stolarczyk.magazyn.Utils.CodeGenerator;
import com.github.dawid_stolarczyk.magazyn.Utils.Hasher;
import com.github.dawid_stolarczyk.magazyn.Utils.LinksUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.UUID;

import static com.github.dawid_stolarczyk.magazyn.Utils.InternetUtils.getClientIp;
import static com.github.dawid_stolarczyk.magazyn.Utils.StringUtils.checkPasswordStrength;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final Bucket4jRateLimiter rateLimiter;
    private final UserRepository userRepository;
    private final SessionManager sessionManager;
    private final EmailVerificationRepository emailVerificationRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;
    private final GeolocationService geolocationService;



    public void logoutUser(HttpServletResponse response, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.AUTH_LOGOUT);
        sessionManager.logoutUser(response, request);
    }

    public void loginUser(LoginRequest loginRequest, HttpServletResponse response, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.AUTH_LOGIN);

        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new AuthenticationException(AuthError.INVALID_CREDENTIALS.name()));
        if (!BCrypt.checkpw(loginRequest.getPassword(), user.getPassword())) {
            throw new AuthenticationException(AuthError.INVALID_CREDENTIALS.name());
        }

        if (!user.getStatus().equals(AccountStatus.ACTIVE) && !user.getStatus().equals(AccountStatus.PENDING_VERIFICATION)) {
            throw new AuthenticationException(AuthError.ACCOUNT_LOCKED.name());
        }

        if (user.getEmailStatus().equals(EmailStatus.UNVERIFIED)) {
            // Automatically resend verification email with strict rate limiting
            resendVerificationEmail(user, request);
            throw new AuthenticationException(AuthError.EMAIL_UNVERIFIED.name());
        }

        // Aktualizacja lastLogin przy każdym udanym uwierzytelnieniu
        user.setLastLogin(Timestamp.from(Instant.now()));
        userRepository.save(user);

        sessionManager.createSuccessLoginSession(user, request, response, loginRequest.isRememberMe(), false);

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

        if (userRepository.existsByPhone(registerRequest.getPhoneNumber())) {
            throw new AuthenticationException(AuthError.PHONE_NUMBER_TAKEN.name());
        }

        newUser.setRawPassword(registerRequest.getPassword());
        newUser.setFullName(registerRequest.getFullName());
        newUser.setRole(UserRole.USER);
        newUser.setStatus(AccountStatus.PENDING_VERIFICATION);
        newUser.setEmailStatus(EmailStatus.UNVERIFIED);

        // Get and set location from IP address
        String clientIp = getClientIp(request);
        String location = geolocationService.getLocationFromIp(clientIp);
        newUser.setLocation(location);

        newUser.setUserHandle(CodeGenerator.generateRandomBase64Url());

        EmailVerification emailVerification = new EmailVerification();
        String emailVerificationToken = UUID.randomUUID().toString();
        emailVerification.setVerificationToken(Hasher.hashSHA256(emailVerificationToken));
        emailVerification.setExpiresAt(Instant.now().plus(15, java.time.temporal.ChronoUnit.MINUTES));
        newUser.setEmailVerifications(emailVerification);
        userRepository.save(newUser);

        String url = LinksUtils.getWebAppUrl("/verify-mail?token=" + emailVerificationToken, request);
        emailService.sendVerificationEmail(newUser.getEmail(), url);
    }

    @Transactional
    public void verifyEmailCheck(String token, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.AUTH_FREE);
        EmailVerification emailVerification = emailVerificationRepository.findByVerificationToken(Hasher.hashSHA256(token)).orElseThrow(()
                -> new AuthenticationException(AuthError.TOKEN_INVALID.name()));

        if (emailVerification.getExpiresAt().isBefore(Instant.now())) {
            throw new AuthenticationException(AuthError.TOKEN_EXPIRED.name());
        }
        User user = emailVerification.getUser();
        user.removeEmailVerifications();
        user.setEmailStatus(EmailStatus.VERIFIED);
        userRepository.save(user);
    }

    @Transactional(rollbackFor = Exception.class)
    public void forgotPassword(String email, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.FORGOT_PASSWORD);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AuthenticationException(AuthError.EMAIL_NOT_FOUND.name()));

        passwordResetTokenRepository.deleteByUser(user);

        passwordResetTokenRepository.flush();

        // Generate new reset token
        String resetToken = UUID.randomUUID().toString();
        PasswordResetToken passwordResetToken = new PasswordResetToken();
        passwordResetToken.setResetToken(Hasher.hashSHA256(resetToken));
        passwordResetToken.setUser(user);
        passwordResetToken.setExpiresAt(Instant.now().plus(15, java.time.temporal.ChronoUnit.MINUTES));
        passwordResetToken.setUsed(false);
        passwordResetTokenRepository.save(passwordResetToken);

        String url = LinksUtils.getWebAppUrl("/reset-password?token=" + resetToken, request);
        emailService.sendPasswordResetEmail(user.getEmail(), url);
    }

    @Transactional(rollbackFor = Exception.class)
    public void resetPassword(String token, String newPassword, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.AUTH_FREE);

        if (!checkPasswordStrength(newPassword)) {
            throw new AuthenticationException(AuthError.WEAK_PASSWORD.name());
        }

        PasswordResetToken passwordResetToken = passwordResetTokenRepository.findByResetToken(Hasher.hashSHA256(token))
                .orElseThrow(() -> new AuthenticationException(AuthError.RESET_TOKEN_INVALID.name()));

        if (passwordResetToken.getExpiresAt().isBefore(Instant.now())) {
            throw new AuthenticationException(AuthError.RESET_TOKEN_EXPIRED.name());
        }

        if (passwordResetToken.isUsed()) {
            throw new AuthenticationException(AuthError.RESET_TOKEN_INVALID.name());
        }

        // Update password
        User user = passwordResetToken.getUser();
        user.setRawPassword(newPassword);
        userRepository.save(user);

        // Mark token as used and delete it
        passwordResetToken.setUsed(true);
        passwordResetTokenRepository.deleteById(passwordResetToken.getId());
    }

    @Transactional(rollbackFor = Exception.class)
    private void resendVerificationEmail(User user, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.EMAIL_VERIFICATION_RESEND);

        // Delete existing verification token if present
        EmailVerification existingVerification = user.getEmailVerifications();
        if (existingVerification != null) {
            user.removeEmailVerifications();

            emailVerificationRepository.deleteById(existingVerification.getId());
            emailVerificationRepository.flush();
        }

        // Generate new verification token
        EmailVerification emailVerification = new EmailVerification();
        String emailVerificationToken = UUID.randomUUID().toString();
        emailVerification.setVerificationToken(Hasher.hashSHA256(emailVerificationToken));
        emailVerification.setExpiresAt(Instant.now().plus(15, java.time.temporal.ChronoUnit.MINUTES));
        user.setEmailVerifications(emailVerification);
        userRepository.save(user);

        String url = LinksUtils.getWebAppUrl("/verify-mail?token=" + emailVerificationToken, request);
        emailService.sendVerificationEmail(user.getEmail(), url);
    }

}
