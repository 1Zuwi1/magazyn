package com.github.dawid_stolarczyk.magazyn.Services.User;

import com.github.dawid_stolarczyk.magazyn.Common.Enums.AuthError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ChangeEmailRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ChangeFullNameRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ChangePasswordRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.UserInfoResponse;
import com.github.dawid_stolarczyk.magazyn.Exception.AuthenticationException;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.EmailVerification;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AccountStatus;
import com.github.dawid_stolarczyk.magazyn.Repositories.UserRepository;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.AuthUtil;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.Entity.AuthPrincipal;
import com.github.dawid_stolarczyk.magazyn.Security.SessionManager;
import com.github.dawid_stolarczyk.magazyn.Services.EmailService;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.RateLimitOperation;
import com.github.dawid_stolarczyk.magazyn.Utils.Hasher;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.time.Instant;
import java.util.UUID;

import static com.github.dawid_stolarczyk.magazyn.Utils.InternetUtils.getClientIp;
import static com.github.dawid_stolarczyk.magazyn.Utils.StringUtils.checkPasswordStrength;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final Bucket4jRateLimiter rateLimiter;
    private final EmailService emailService;
    private final SessionManager sessionManager;


    public UserInfoResponse getBasicInformation(HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.USER_ACTION_FREE);
        User user = userRepository.findById(AuthUtil.getCurrentAuthPrincipal().getUserId())
                .orElseThrow(() -> new AuthenticationException(AuthError.NOT_AUTHENTICATED.name()));
        return new UserInfoResponse(
                user.getId().intValue(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(),
                user.getStatus().name());
    }

    @Transactional
    public void changeEmail(ChangeEmailRequest changeRequest, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.USER_ACTION_STRICT);
        AuthPrincipal authPrincipal = AuthUtil.getCurrentAuthPrincipal();

        if (!authPrincipal.isSudoMode()) {
            throw new AuthenticationException(AuthError.INSUFFICIENT_PERMISSIONS.name());
        }

        User user = userRepository.findById(authPrincipal.getUserId())
                .orElseThrow(() -> new AuthenticationException(AuthError.NOT_AUTHENTICATED.name()));

        String newEmail = changeRequest.getNewEmail().trim();
        if (newEmail.equalsIgnoreCase(user.getEmail())) {
            return;
        }

        if (userRepository.findByEmail(newEmail).isPresent()) {
            throw new AuthenticationException(AuthError.EMAIL_TAKEN.name());
        }

        user.removeEmailVerifications();
        user.setEmail(newEmail);
        user.setStatus(AccountStatus.PENDING_VERIFICATION);

        EmailVerification emailVerification = new EmailVerification();
        String emailVerificationToken = UUID.randomUUID().toString();
        emailVerification.setVerificationToken(Hasher.hashSHA256(emailVerificationToken));
        emailVerification.setExpiresAt(Instant.now().plus(15, java.time.temporal.ChronoUnit.MINUTES));
        user.setEmailVerifications(emailVerification);

        try {
            userRepository.save(user);
        } catch (DataIntegrityViolationException e) {
            throw new AuthenticationException(AuthError.EMAIL_TAKEN.name());
        }

        String baseUrl = ServletUriComponentsBuilder.fromContextPath(request)
                .path("/auth/verify-email")
                .toUriString();
        emailService.sendVerificationEmail(user.getEmail(), baseUrl + "?token=" + emailVerificationToken);
    }

    @Transactional
    public void changePassword(ChangePasswordRequest changeRequest, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.USER_ACTION_STRICT);
        AuthPrincipal authPrincipal = AuthUtil.getCurrentAuthPrincipal();

        if (!authPrincipal.isSudoMode()) {
            throw new AuthenticationException(AuthError.INSUFFICIENT_PERMISSIONS.name());
        }

        User user = userRepository.findById(authPrincipal.getUserId())
                .orElseThrow(() -> new AuthenticationException(AuthError.NOT_AUTHENTICATED.name()));

        if (!BCrypt.checkpw(changeRequest.getOldPassword(), user.getPassword())) {
            throw new AuthenticationException(AuthError.INVALID_CREDENTIALS.name());
        }
        if (!checkPasswordStrength(changeRequest.getNewPassword())) {
            throw new AuthenticationException(AuthError.WEAK_PASSWORD.name());
        }

        user.setRawPassword(changeRequest.getNewPassword());
        userRepository.save(user);
    }

    @Transactional
    public void changeFullName(ChangeFullNameRequest changeRequest, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.USER_ACTION_STRICT);
        AuthPrincipal authPrincipal = AuthUtil.getCurrentAuthPrincipal();
        if (!authPrincipal.isSudoMode()) {
            throw new AuthenticationException(AuthError.INSUFFICIENT_PERMISSIONS.name());
        }
        User user = userRepository.findById(authPrincipal.getUserId())
                .orElseThrow(() -> new AuthenticationException(AuthError.NOT_AUTHENTICATED.name()));

        user.setFullName(changeRequest.getNewFullName());
        userRepository.save(user);
    }

    @Transactional
    public void deleteAccount(HttpServletRequest request, HttpServletResponse response) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.USER_ACTION_STRICT);
        AuthPrincipal authPrincipal = AuthUtil.getCurrentAuthPrincipal();

        if (!authPrincipal.isSudoMode()) {
            throw new AuthenticationException(AuthError.INSUFFICIENT_PERMISSIONS.name());
        }

        User user = userRepository.findById(authPrincipal.getUserId())
                .orElseThrow(() -> new AuthenticationException(AuthError.NOT_AUTHENTICATED.name()));

        sessionManager.logoutUser(response, request);
        userRepository.delete(user);
    }

}
