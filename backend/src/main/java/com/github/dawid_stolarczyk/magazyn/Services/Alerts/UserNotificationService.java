package com.github.dawid_stolarczyk.magazyn.Services.Alerts;

import com.github.dawid_stolarczyk.magazyn.Common.Enums.AuthError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.AlertDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.UserNotificationDto;
import com.github.dawid_stolarczyk.magazyn.Exception.AuthenticationException;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Alert;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.UserNotification;
import com.github.dawid_stolarczyk.magazyn.Repositories.UserNotificationRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.UserRepository;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.AuthUtil;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.Entity.AuthPrincipal;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.RateLimitOperation;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.github.dawid_stolarczyk.magazyn.Utils.InternetUtils.getClientIp;

/**
 * Service for managing user-specific notifications
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserNotificationService {

    private final UserNotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final Bucket4jRateLimiter rateLimiter;

    /**
     * Get all notifications for the current user
     */
    public Page<UserNotificationDto> getMyNotifications(HttpServletRequest httpRequest, Pageable pageable) {
        rateLimiter.consumeOrThrow(getClientIp(httpRequest), RateLimitOperation.INVENTORY_READ);

        AuthPrincipal authPrincipal = AuthUtil.getCurrentAuthPrincipal();
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(authPrincipal.getUserId(), pageable)
                .map(this::mapToDto);
    }

    /**
     * Get unread notifications for the current user
     */
    public Page<UserNotificationDto> getMyUnreadNotifications(HttpServletRequest httpRequest, Pageable pageable) {
        rateLimiter.consumeOrThrow(getClientIp(httpRequest), RateLimitOperation.INVENTORY_READ);

        AuthPrincipal authPrincipal = AuthUtil.getCurrentAuthPrincipal();
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(authPrincipal.getUserId(), pageable)
                .map(this::mapToDto);
    }

    /**
     * Get count of unread notifications for the current user
     */
    public long getUnreadCount(HttpServletRequest httpRequest) {
        rateLimiter.consumeOrThrow(getClientIp(httpRequest), RateLimitOperation.INVENTORY_READ);

        AuthPrincipal authPrincipal = AuthUtil.getCurrentAuthPrincipal();
        return notificationRepository.countByUserIdAndIsReadFalse(authPrincipal.getUserId());
    }

    /**
     * Mark a notification as read
     */
    @Transactional
    public UserNotificationDto markAsRead(Long notificationId, HttpServletRequest httpRequest) {
        rateLimiter.consumeOrThrow(getClientIp(httpRequest), RateLimitOperation.INVENTORY_WRITE);

        AuthPrincipal authPrincipal = AuthUtil.getCurrentAuthPrincipal();

        UserNotification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("NOTIFICATION_NOT_FOUND"));

        // Verify ownership
        if (!notification.getUser().getId().equals(authPrincipal.getUserId())) {
            throw new AuthenticationException(AuthError.INSUFFICIENT_PERMISSIONS.name());
        }

        notification.markAsRead();
        notificationRepository.save(notification);

        log.debug("Notification {} marked as read by user {}", notificationId, authPrincipal.getUserId());

        return mapToDto(notification);
    }

    /**
     * Mark a notification as unread
     */
    @Transactional
    public UserNotificationDto markAsUnread(Long notificationId, HttpServletRequest httpRequest) {
        rateLimiter.consumeOrThrow(getClientIp(httpRequest), RateLimitOperation.INVENTORY_WRITE);

        AuthPrincipal authPrincipal = AuthUtil.getCurrentAuthPrincipal();

        UserNotification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("NOTIFICATION_NOT_FOUND"));

        // Verify ownership
        if (!notification.getUser().getId().equals(authPrincipal.getUserId())) {
            throw new AuthenticationException(AuthError.INSUFFICIENT_PERMISSIONS.name());
        }

        notification.markAsUnread();
        notificationRepository.save(notification);

        log.debug("Notification {} marked as unread by user {}", notificationId, authPrincipal.getUserId());

        return mapToDto(notification);
    }

    /**
     * Mark all notifications as read for the current user
     */
    @Transactional
    public int markAllAsRead(HttpServletRequest httpRequest) {
        rateLimiter.consumeOrThrow(getClientIp(httpRequest), RateLimitOperation.INVENTORY_WRITE);

        AuthPrincipal authPrincipal = AuthUtil.getCurrentAuthPrincipal();
        int updated = notificationRepository.markAllAsReadForUser(authPrincipal.getUserId());

        log.info("Marked {} notifications as read for user {}", updated, authPrincipal.getUserId());

        return updated;
    }

    /**
     * Get notification by alert ID for the current user
     */
    public UserNotificationDto getNotificationByAlert(Long alertId, HttpServletRequest httpRequest) {
        rateLimiter.consumeOrThrow(getClientIp(httpRequest), RateLimitOperation.INVENTORY_READ);

        AuthPrincipal authPrincipal = AuthUtil.getCurrentAuthPrincipal();

        UserNotification notification = notificationRepository.findByUserIdAndAlertId(authPrincipal.getUserId(), alertId)
                .orElseThrow(() -> new IllegalArgumentException("NOTIFICATION_NOT_FOUND"));

        return mapToDto(notification);
    }

    /**
     * Maps UserNotification entity to DTO
     */
    private UserNotificationDto mapToDto(UserNotification notification) {
        Alert alert = notification.getAlert();

        AlertDto alertDto = AlertDto.builder()
                .id(alert.getId())
                .rackId(alert.getRack().getId())
                .rackMarker(alert.getRack().getMarker())
                .warehouseId(alert.getWarehouse().getId())
                .warehouseName(alert.getWarehouse().getName())
                .alertType(alert.getAlertType())
                .alertTypeDescription(alert.getAlertType().getDescription())
                .status(alert.getStatus())
                .message(alert.getMessage())
                .thresholdValue(alert.getThresholdValue())
                .actualValue(alert.getActualValue())
                .createdAt(alert.getCreatedAt())
                .updatedAt(alert.getUpdatedAt())
                .resolvedAt(alert.getResolvedAt())
                .resolvedByName(alert.getResolvedBy() != null ? alert.getResolvedBy().getFullName() : null)
                .resolutionNotes(alert.getResolutionNotes())
                .build();

        return UserNotificationDto.builder()
                .id(notification.getId())
                .alert(alertDto)
                .isRead(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .readAt(notification.getReadAt())
                .build();
    }
}
