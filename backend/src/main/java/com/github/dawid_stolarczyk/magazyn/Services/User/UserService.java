package com.github.dawid_stolarczyk.magazyn.Services.User;

import com.github.dawid_stolarczyk.magazyn.Common.Enums.AuthError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ChangePasswordRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.UpdateUserProfileRequest;
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
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.time.Instant;
import java.util.List;
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
                user.getStatus().name(),
                user.getPhone(),
                user.getLocation(),
                user.getTeam() != null ? user.getTeam().name() : null);
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

    // ===== Admin methods =====

    /**
     * Admin: Get all users
     */
    public List<UserInfoResponse> adminGetAllUsers(HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.USER_ACTION_FREE);
        AuthPrincipal authPrincipal = AuthUtil.getCurrentAuthPrincipal();
        return userRepository.findAll().stream()
                .filter(u -> !u.getId().equals(authPrincipal.getUserId()))
                .map(user -> new UserInfoResponse(
                        user.getId().intValue(),
                        user.getFullName(),
                        user.getEmail(),
                        user.getRole().name(),
                        user.getStatus().name(),
                        user.getPhone(),
                        user.getLocation(),
                        user.getTeam() != null ? user.getTeam().name() : null
                ))
                .toList();
    }

    /**
     * Admin: Change email for any user
     * Note: Database UNIQUE constraint on email column provides additional protection against race conditions
     */
    @Transactional
    public void adminChangeEmail(Long targetUserId, String newEmail, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.USER_ACTION_STRICT);
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new AuthenticationException(AuthError.RESOURCE_NOT_FOUND.name()));

        // Sprawdź czy email nie jest już zajęty przez innego użytkownika
        // Database UNIQUE constraint zapewnia dodatkową ochronę przed race condition
        userRepository.findByEmail(newEmail).ifPresent(existingUser -> {
            if (!existingUser.getId().equals(targetUserId)) {
                throw new AuthenticationException(AuthError.EMAIL_TAKEN.name());
            }
        });

        targetUser.removeEmailVerifications();
        targetUser.setEmail(newEmail);
        targetUser.setStatus(AccountStatus.PENDING_VERIFICATION);

        EmailVerification emailVerification = new EmailVerification();
        String emailVerificationToken = UUID.randomUUID().toString();
        emailVerification.setVerificationToken(Hasher.hashSHA256(emailVerificationToken));
        emailVerification.setExpiresAt(Instant.now().plus(15, java.time.temporal.ChronoUnit.MINUTES));
        targetUser.setEmailVerifications(emailVerification);

        userRepository.save(targetUser);

        String baseUrl = ServletUriComponentsBuilder.fromContextPath(request)
                .path("/auth/verify-email")
                .toUriString();
        emailService.sendVerificationEmail(targetUser.getEmail(), baseUrl + "?token=" + emailVerificationToken);
    }

    /**
     * Admin: Change full name for any user
     */
    @Transactional
    public void adminChangeFullName(Long targetUserId, String newFullName, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.USER_ACTION_STRICT);
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new AuthenticationException(AuthError.RESOURCE_NOT_FOUND.name()));

        targetUser.setFullName(newFullName);
        userRepository.save(targetUser);
    }

    /**
     * Admin: Update user profile (phone, location, team, full name)
     */
    @Transactional
    public void adminUpdateUserProfile(Long targetUserId, UpdateUserProfileRequest profileRequest, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.USER_ACTION_STRICT);
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new AuthenticationException(AuthError.RESOURCE_NOT_FOUND.name()));

        if (profileRequest.getPhone() != null) {
            String phone = profileRequest.getPhone().strip();
            if (!phone.isEmpty()) {
                // Walidacja długości
                if (phone.length() > 20) {
                    throw new IllegalArgumentException("INVALID_PHONE_FORMAT");
                }
                // Walidacja formatu
                if (!phone.matches("^[+\\d\\s()-]*$")) {
                    throw new IllegalArgumentException("INVALID_PHONE_FORMAT");
                }
                targetUser.setPhone(phone);
            } else {
                targetUser.setPhone(null);
            }
        }

        if (profileRequest.getLocation() != null) {
            String location = profileRequest.getLocation().strip();
            if (location.length() > 100) {
                throw new IllegalArgumentException("INVALID_INPUT");
            }
            targetUser.setLocation(location.isEmpty() ? null : location);
        }

        if (profileRequest.getTeam() != null) {
            targetUser.setTeam(profileRequest.getTeam());
        }

        if (profileRequest.getFullName() != null) {
            String fullName = profileRequest.getFullName().strip();
            if (fullName.isEmpty() || fullName.length() < 3 || fullName.length() > 100) {
                throw new IllegalArgumentException("INVALID_FULL_NAME");
            }
            targetUser.setFullName(fullName);
        }

        userRepository.save(targetUser);
    }

    /**
     * Admin: Delete any user account
     */
    @Transactional
    public void adminDeleteAccount(Long targetUserId, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.USER_ACTION_STRICT);
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new AuthenticationException(AuthError.RESOURCE_NOT_FOUND.name()));

        userRepository.delete(targetUser);
    }
}
