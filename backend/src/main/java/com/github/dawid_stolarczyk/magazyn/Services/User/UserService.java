package com.github.dawid_stolarczyk.magazyn.Services.User;

import com.github.dawid_stolarczyk.magazyn.Common.Enums.AuthError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ChangePasswordRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.UpdateUserProfileRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.UserInfoResponse;
import com.github.dawid_stolarczyk.magazyn.Exception.AuthenticationException;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.EmailVerification;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Warehouse;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AccountStatus;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.EmailStatus;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.UserRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.WarehouseRepository;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.AuthUtil;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.Entity.AuthPrincipal;
import com.github.dawid_stolarczyk.magazyn.Security.SessionManager;
import com.github.dawid_stolarczyk.magazyn.Services.EmailService;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.RateLimitOperation;
import com.github.dawid_stolarczyk.magazyn.Utils.Hasher;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
    private final WarehouseRepository warehouseRepository;
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
                user.getTeam() != null ? user.getTeam().name() : null,
                user.getLastLogin() != null ? user.getLastLogin().toInstant().toString() : null);
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
     * Admin: Get all users (non-paginated - deprecated, use paginated version)
     */
    public List<UserInfoResponse> adminGetAllUsers(HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.USER_ACTION_FREE);
        AuthPrincipal authPrincipal = AuthUtil.getCurrentAuthPrincipal();
        return userRepository.findAll().stream()
                .filter(u -> !u.getId().equals(authPrincipal.getUserId()))
                .map(this::mapToUserInfoResponse)
                .toList();
    }

    /**
     * Admin: Get all users with pagination and optional filtering
     *
     * @param name   Optional filter by full name (case-insensitive, partial match)
     * @param email  Optional filter by email (case-insensitive, partial match)
     * @param status Optional filter by account status
     */
    public Page<UserInfoResponse> adminGetAllUsersPaged(HttpServletRequest request, String name, String email, AccountStatus status, Pageable pageable) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.USER_ACTION_FREE);
        AuthPrincipal authPrincipal = AuthUtil.getCurrentAuthPrincipal();
        return userRepository.findUsersWithFilters(
                        authPrincipal.getUserId(),
                        name,
                        email,
                        status,
                        pageable)
                .map(this::mapToUserInfoResponse);
    }

    private UserInfoResponse mapToUserInfoResponse(User user) {
        return new UserInfoResponse(
                user.getId().intValue(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(),
                user.getStatus().name(),
                user.getPhone(),
                user.getLocation(),
                user.getTeam() != null ? user.getTeam().name() : null,
                user.getLastLogin() != null ? user.getLastLogin().toInstant().toString() : null
        );
    }

    /**
     * Admin: Change email for any user
     * <p>
     * Race condition protection:
     * 1. Application-level check (findByEmail) provides early validation
     * 2. Database UNIQUE constraint on email column (User.java:26) provides ultimate protection
     * - If two concurrent requests pass check #1, the second save() will fail with DataIntegrityViolationException
     * - GlobalExceptionHandler converts this to appropriate error response
     * <p>
     * Note: Method is transactional to ensure atomicity of email change and verification setup
     */
    @Transactional
    public void adminChangeEmail(Long targetUserId, String newEmail, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.USER_ACTION_STRICT);
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new AuthenticationException(AuthError.RESOURCE_NOT_FOUND.name()));

        // Application-level check: provides early validation and better error messages
        // Note: Race condition possible here, but DB constraint provides final protection
        userRepository.findByEmail(newEmail).ifPresent(existingUser -> {
            if (!existingUser.getId().equals(targetUserId)) {
                throw new AuthenticationException(AuthError.EMAIL_TAKEN.name());
            }
        });

        targetUser.removeEmailVerifications();
        targetUser.setEmail(newEmail);
        targetUser.setStatus(AccountStatus.PENDING_VERIFICATION);
        targetUser.setEmailStatus(EmailStatus.UNVERIFIED);

        EmailVerification emailVerification = new EmailVerification();
        String emailVerificationToken = UUID.randomUUID().toString();
        emailVerification.setVerificationToken(Hasher.hashSHA256(emailVerificationToken));
        emailVerification.setExpiresAt(Instant.now().plus(15, java.time.temporal.ChronoUnit.MINUTES));
        targetUser.setEmailVerifications(emailVerification);

        userRepository.save(targetUser);

        String baseUrl = ServletUriComponentsBuilder.fromContextPath(request)
                .replacePath(null)
                .path("/verify-mail")
                .toUriString();
        emailService.sendVerificationEmail(targetUser.getEmail(), baseUrl + "?token=" + emailVerificationToken);
    }

    /**
     * Admin: Update user profile (phone, location, team, full name)
     * Note: DTO validation (@Pattern, @Size) handles format and length constraints
     */
    @Transactional
    public void adminUpdateUserProfile(Long targetUserId, UpdateUserProfileRequest profileRequest, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.USER_ACTION_STRICT);
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new AuthenticationException(AuthError.RESOURCE_NOT_FOUND.name()));

        if (profileRequest.getPhone() != null) {
            String phone = profileRequest.getPhone().strip();
            targetUser.setPhone(phone.isEmpty() ? null : phone);
        }

        if (profileRequest.getLocation() != null) {
            String location = profileRequest.getLocation().strip();
            targetUser.setLocation(location.isEmpty() ? null : location);
        }

        if (profileRequest.getTeam() != null) {
            targetUser.setTeam(profileRequest.getTeam());
        }

        if (profileRequest.getFullName() != null) {
            String fullName = profileRequest.getFullName().strip();
            if (fullName.isEmpty()) {
                throw new IllegalArgumentException(AuthError.INVALID_FULL_NAME.name());
            }
            targetUser.setFullName(fullName);
        }

        userRepository.save(targetUser);
    }

    /**
     * Admin: Update user account status
     * Changes the account status (ACTIVE, DISABLED, LOCKED, PENDING_VERIFICATION)
     * Note: When a user is DISABLED or LOCKED, existing sessions will be blocked on next request
     */
    @Transactional
    public void adminUpdateUserStatus(Long targetUserId, AccountStatus newStatus, String reason, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.USER_ACTION_STRICT);
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new AuthenticationException(AuthError.RESOURCE_NOT_FOUND.name()));

        // Prevent admins from locking/disabling themselves
        AuthPrincipal authPrincipal = AuthUtil.getCurrentAuthPrincipal();
        if (targetUser.getId().equals(authPrincipal.getUserId())) {
            throw new AuthenticationException(AuthError.CANNOT_MODIFY_OWN_STATUS.name());
        }

        targetUser.setStatus(newStatus);
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

    /**
     * Admin: Assign user to warehouse
     * Grants user access to receive notifications from the specified warehouse
     */
    @Transactional(rollbackFor = Exception.class)
    public void assignUserToWarehouse(Long userId, Long warehouseId, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.USER_ACTION_STRICT);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AuthenticationException(AuthError.RESOURCE_NOT_FOUND.name()));

        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new IllegalArgumentException("WAREHOUSE_NOT_FOUND"));

        user.assignToWarehouse(warehouse);
        userRepository.save(user);
    }

    /**
     * Admin: Remove user from warehouse
     * Revokes user's access to the specified warehouse
     */
    @Transactional(rollbackFor = Exception.class)
    public void removeUserFromWarehouse(Long userId, Long warehouseId, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.USER_ACTION_STRICT);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AuthenticationException(AuthError.RESOURCE_NOT_FOUND.name()));

        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new IllegalArgumentException("WAREHOUSE_NOT_FOUND"));

        user.removeFromWarehouse(warehouse);
        userRepository.save(user);
    }

    /**
     * Admin: Get all warehouses assigned to a user
     */
    public List<Long> getUserWarehouseIds(Long userId, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.USER_ACTION_FREE);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AuthenticationException(AuthError.RESOURCE_NOT_FOUND.name()));

        return user.getAssignedWarehouses().stream()
                .map(Warehouse::getId)
                .toList();
    }
}
