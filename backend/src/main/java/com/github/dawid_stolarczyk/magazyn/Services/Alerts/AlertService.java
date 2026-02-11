package com.github.dawid_stolarczyk.magazyn.Services.Alerts;

import com.github.dawid_stolarczyk.magazyn.Common.Enums.AuthError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.AlertDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.AlertStatusUpdateRequest;
import com.github.dawid_stolarczyk.magazyn.Exception.AuthenticationException;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Alert;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AlertStatus;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AlertType;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.AlertRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.UserRepository;
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

import java.util.Arrays;
import java.util.List;

import static com.github.dawid_stolarczyk.magazyn.Utils.InternetUtils.getClientIp;

/**
 * Service for managing alerts (system-wide view)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AlertService {

    private final AlertRepository alertRepository;
    private final UserRepository userRepository;
    private final Bucket4jRateLimiter rateLimiter;

    /**
     * Get all alerts with pagination (global view)
     */
    public Page<AlertDto> getAllAlerts(HttpServletRequest httpRequest, Pageable pageable) {
        rateLimiter.consumeOrThrow(getClientIp(httpRequest), RateLimitOperation.INVENTORY_READ);
        return alertRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::mapToDto);
    }

    /**
     * Get only active (unresolved) alerts
     */
    public Page<AlertDto> getActiveAlerts(HttpServletRequest httpRequest, Pageable pageable) {
        rateLimiter.consumeOrThrow(getClientIp(httpRequest), RateLimitOperation.INVENTORY_READ);
        List<AlertStatus> activeStatuses = Arrays.asList(AlertStatus.OPEN, AlertStatus.ACTIVE);
        return alertRepository.findByStatusInOrderByCreatedAtDesc(activeStatuses, pageable).map(this::mapToDto);
    }

    /**
     * Get alerts for a specific warehouse
     */
    public Page<AlertDto> getAlertsByWarehouse(Long warehouseId, HttpServletRequest httpRequest, Pageable pageable) {
        rateLimiter.consumeOrThrow(getClientIp(httpRequest), RateLimitOperation.INVENTORY_READ);
        return alertRepository.findByWarehouseIdOrderByCreatedAtDesc(warehouseId, pageable).map(this::mapToDto);
    }

    /**
     * Get alerts for a specific rack
     */
    public Page<AlertDto> getAlertsByRack(Long rackId, HttpServletRequest httpRequest, Pageable pageable) {
        rateLimiter.consumeOrThrow(getClientIp(httpRequest), RateLimitOperation.INVENTORY_READ);
        return alertRepository.findByRackIdOrderByCreatedAtDesc(rackId, pageable).map(this::mapToDto);
    }

    /**
     * Get alerts by multiple statuses
     */
    public Page<AlertDto> getAlertsByStatuses(List<AlertStatus> statuses, HttpServletRequest httpRequest, Pageable pageable) {
        rateLimiter.consumeOrThrow(getClientIp(httpRequest), RateLimitOperation.INVENTORY_READ);
        return alertRepository.findByStatusInOrderByCreatedAtDesc(statuses, pageable).map(this::mapToDto);
    }

    /**
     * Get alerts by multiple types
     */
    public Page<AlertDto> getAlertsByTypes(List<AlertType> types, HttpServletRequest httpRequest, Pageable pageable) {
        rateLimiter.consumeOrThrow(getClientIp(httpRequest), RateLimitOperation.INVENTORY_READ);
        return alertRepository.findByAlertTypeInOrderByCreatedAtDesc(types, pageable).map(this::mapToDto);
    }

    /**
     * Get single alert by ID
     */
    public AlertDto getAlertById(Long alertId, HttpServletRequest httpRequest) {
        rateLimiter.consumeOrThrow(getClientIp(httpRequest), RateLimitOperation.INVENTORY_READ);
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new IllegalArgumentException("ALERT_NOT_FOUND"));
        return mapToDto(alert);
    }

    /**
     * Update alert status (resolve, dismiss, etc.)
     */
    @Transactional
    public AlertDto updateAlertStatus(Long alertId, AlertStatusUpdateRequest request, HttpServletRequest httpRequest) {
        rateLimiter.consumeOrThrow(getClientIp(httpRequest), RateLimitOperation.INVENTORY_WRITE);

        AuthPrincipal authPrincipal = AuthUtil.getCurrentAuthPrincipal();
        User currentUser = userRepository.findById(authPrincipal.getUserId())
                .orElseThrow(() -> new AuthenticationException(AuthError.NOT_AUTHENTICATED.name()));

        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new IllegalArgumentException("ALERT_NOT_FOUND"));

        // Update status based on request
        switch (request.getStatus()) {
            case RESOLVED -> alert.resolve(currentUser, request.getResolutionNotes());
            case DISMISSED -> alert.dismiss(currentUser, request.getResolutionNotes());
            case ACTIVE -> {
                alert.setStatus(AlertStatus.ACTIVE);
                alert.setResolutionNotes(request.getResolutionNotes());
            }
            case OPEN -> {
                alert.setStatus(AlertStatus.OPEN);
                alert.setResolvedAt(null);
                alert.setResolvedBy(null);
                alert.setResolutionNotes(null);
            }
            default -> throw new IllegalArgumentException("Unsupported alert status: " + request.getStatus());
        }

        alertRepository.save(alert);
        log.info("Alert {} status updated to {} by user {}", alertId, request.getStatus(), currentUser.getId());

        return mapToDto(alert);
    }

    /**
     * Get alert statistics
     */
    public AlertStatistics getStatistics(HttpServletRequest httpRequest) {
        rateLimiter.consumeOrThrow(getClientIp(httpRequest), RateLimitOperation.INVENTORY_READ);

        return AlertStatistics.builder()
                .totalAlerts(alertRepository.count())
                .openAlerts(alertRepository.countByStatus(AlertStatus.OPEN))
                .activeAlerts(alertRepository.countByStatus(AlertStatus.ACTIVE))
                .resolvedAlerts(alertRepository.countByStatus(AlertStatus.RESOLVED))
                .dismissedAlerts(alertRepository.countByStatus(AlertStatus.DISMISSED))
                .unresolvedAlerts(alertRepository.countUnresolvedAlerts())
                .build();
    }

    /**
     * Maps Alert entity to DTO
     */
    private AlertDto mapToDto(Alert alert) {
        return AlertDto.builder()
                .id(alert.getId())
                .rackId(alert.getRack() != null ? alert.getRack().getId() : null)
                .rackMarker(alert.getRack() != null ? alert.getRack().getMarker() : null)
                .warehouseId(alert.getWarehouse() != null ? alert.getWarehouse().getId() : null)
                .warehouseName(alert.getWarehouse() != null ? alert.getWarehouse().getName() : null)
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
    }

    /**
     * Inner class for alert statistics
     */
    @lombok.Data
    @lombok.Builder
    public static class AlertStatistics {
        private long totalAlerts;
        private long openAlerts;
        private long activeAlerts;
        private long resolvedAlerts;
        private long dismissedAlerts;
        private long unresolvedAlerts;
    }
}
