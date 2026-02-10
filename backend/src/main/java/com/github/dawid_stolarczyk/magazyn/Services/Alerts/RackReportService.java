package com.github.dawid_stolarczyk.magazyn.Services.Alerts;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.RackReportDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.RackReportRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.RackReportResponse;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.*;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AccountStatus;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AlertStatus;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AlertType;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.*;
import com.github.dawid_stolarczyk.magazyn.Services.EmailService;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.RateLimitOperation;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

import static com.github.dawid_stolarczyk.magazyn.Utils.InternetUtils.getClientIp;

/**
 * Service for processing rack reports and generating alerts.
 * Implements deduplication logic to avoid spam notifications.
 */
@Service
@RequiredArgsConstructor
public class RackReportService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(RackReportService.class);

    private static final List<AlertStatus> ACTIVE_STATUSES = Arrays.asList(AlertStatus.OPEN, AlertStatus.ACTIVE);

    private record AlertNotificationResult(List<User> usersToEmail, String alertMessage) {}

    private final RackReportRepository reportRepository;
    private final RackRepository rackRepository;
    private final AlertRepository alertRepository;
    private final AssortmentRepository assortmentRepository;
    private final UserRepository userRepository;
    private final UserNotificationRepository notificationRepository;
    private final Bucket4jRateLimiter rateLimiter;
    private final EmailService emailService;

    /**
     * Process a new rack report and generate alerts if anomalies are detected.
     * <p>
     * Algorithm:
     * 1. Validate rack exists
     * 2. Create and save the report
     * 3. Check for anomalies (weight, temperature)
     * 4. For each anomaly, check if an active alert already exists
     * 5. If no active alert exists, create new alert and distribute notifications
     *
     * @param request     The rack report request
     * @param httpRequest HTTP request for rate limiting
     * @return Response with report details and any triggered alerts
     */
    @Transactional(rollbackFor = Exception.class)
    public RackReportResponse processReport(RackReportRequest request, HttpServletRequest httpRequest) {
        rateLimiter.consumeOrThrow(getClientIp(httpRequest), RateLimitOperation.INVENTORY_WRITE);

        if (request.getCurrentTemperature() == null && request.getCurrentWeight() == null) {
            throw new IllegalArgumentException("Temperature or weight must be provided");
        }

        // 1. Validate rack exists
        Rack rack = rackRepository.findById(request.getRackId())
                .orElseThrow(() -> new IllegalArgumentException("RACK_NOT_FOUND"));

        // 2. Create the report
        RackReport report = RackReport.builder()
                .rack(rack)
                .currentWeight(request.getCurrentWeight())
                .currentTemperature(request.getCurrentTemperature())
                .sensorId(request.getSensorId())
                .alertTriggered(false)
                .createdAt(Instant.now())
                .build();

        report = reportRepository.save(report);

        // 3. Check for anomalies and generate alerts
        List<AlertType> triggeredAlerts = new ArrayList<>();
        Map<Long, User> usersById = new HashMap<>();
        Map<Long, List<String>> userAlertMessages = new HashMap<>();

        // Check weight
        if (request.getCurrentWeight() > rack.getMax_weight()) {
            createAlertIfNotExists(rack, report, AlertType.WEIGHT_EXCEEDED,
                    rack.getMax_weight(), request.getCurrentWeight())
                    .ifPresent(result -> {
                        triggeredAlerts.add(AlertType.WEIGHT_EXCEEDED);
                        collectEmailRecipients(result, usersById, userAlertMessages);
                    });
        }

        // Check temperature too high
        if (request.getCurrentTemperature() > rack.getMax_temp()) {
            createAlertIfNotExists(rack, report, AlertType.TEMPERATURE_TOO_HIGH,
                    rack.getMax_temp(), request.getCurrentTemperature())
                    .ifPresent(result -> {
                        triggeredAlerts.add(AlertType.TEMPERATURE_TOO_HIGH);
                        collectEmailRecipients(result, usersById, userAlertMessages);
                    });
        }

        // Check temperature too low
        if (request.getCurrentTemperature() < rack.getMin_temp()) {
            createAlertIfNotExists(rack, report, AlertType.TEMPERATURE_TOO_LOW,
                    rack.getMin_temp(), request.getCurrentTemperature())
                    .ifPresent(result -> {
                        triggeredAlerts.add(AlertType.TEMPERATURE_TOO_LOW);
                        collectEmailRecipients(result, usersById, userAlertMessages);
                    });
        }

        // Check for unauthorized outbound (weight less than sum of assortments)
        if (request.getCurrentWeight() != null) {
            List<Assortment> rackAssortments = assortmentRepository.findByRackId(rack.getId());
            float totalAssortmentWeight = rackAssortments.stream()
                    .map(assortment -> assortment.getItem().getWeight())
                    .reduce(0f, Float::sum);

            if (request.getCurrentWeight() < totalAssortmentWeight) {
                createAlertIfNotExistsForWeight(rack, report, AlertType.UNAUTHORIZED_OUTBOUND,
                        totalAssortmentWeight, request.getCurrentWeight())
                        .ifPresent(result -> {
                            triggeredAlerts.add(AlertType.UNAUTHORIZED_OUTBOUND);
                            collectEmailRecipients(result, usersById, userAlertMessages);
                        });
            }
        }

        // Check item temperature tolerances
        float currentTemp = request.getCurrentTemperature();
        List<Assortment> assortments = assortmentRepository.findByRackId(rack.getId());
        Set<Long> checkedItemIds = new HashSet<>();
        for (Assortment assortment : assortments) {
            Item item = assortment.getItem();
            if (!checkedItemIds.add(item.getId())) continue;

            if (currentTemp > item.getMax_temp()) {
                createAlertIfNotExistsForItem(rack, item, report,
                        AlertType.ITEM_TEMPERATURE_TOO_HIGH, item.getMax_temp(), currentTemp)
                        .ifPresent(result -> {
                            triggeredAlerts.add(AlertType.ITEM_TEMPERATURE_TOO_HIGH);
                            collectEmailRecipients(result, usersById, userAlertMessages);
                        });
            }
            if (currentTemp < item.getMin_temp()) {
                createAlertIfNotExistsForItem(rack, item, report,
                        AlertType.ITEM_TEMPERATURE_TOO_LOW, item.getMin_temp(), currentTemp)
                        .ifPresent(result -> {
                            triggeredAlerts.add(AlertType.ITEM_TEMPERATURE_TOO_LOW);
                            collectEmailRecipients(result, usersById, userAlertMessages);
                        });
            }
        }

        // Send batch emails per user with their specific alert messages
        if (!userAlertMessages.isEmpty()) {
            log.info("Sending batch notification emails to {} users for {} alert types",
                    userAlertMessages.size(), triggeredAlerts.size());
            userAlertMessages.forEach((userId, messages) -> {
                User user = usersById.get(userId);
                emailService.sendBatchNotificationEmail(user.getEmail(), messages);
            });
        }

        // Update report with alert status
        report.setAlertTriggered(!triggeredAlerts.isEmpty());
        reportRepository.save(report);

        log.info("Processed rack report for rack {} - alerts triggered: {}",
                rack.getId(), triggeredAlerts);

        return RackReportResponse.builder()
                .reportId(report.getId())
                .rackId(rack.getId())
                .rackMarker(rack.getMarker())
                .currentWeight(report.getCurrentWeight())
                .currentTemperature(report.getCurrentTemperature())
                .alertTriggered(report.isAlertTriggered())
                .triggeredAlertTypes(triggeredAlerts.stream().map(Enum::name).toList())
                .createdAt(report.getCreatedAt())
                .build();
    }

    /**
     * Creates an alert if no active alert of the same type exists for rack.
     * If an alert exists and the new value is more severe, updates data and redistributes notifications.
     * If the value is same or less severe, still updates alert data but without notifications or emails.
     *
     * @return Optional with users to email and the alert message (empty if no notifications needed)
     */
    private Optional<AlertNotificationResult> createAlertIfNotExists(Rack rack, RackReport report, AlertType alertType,
                                           float thresholdValue, float actualValue) {
        Optional<Alert> existingAlert = alertRepository.findActiveAlertForRack(rack.getId(), alertType, ACTIVE_STATUSES);

        if (existingAlert.isPresent()) {
            Alert alert = existingAlert.get();
            boolean moreSevere = shouldUpdateAlert(alertType, alert.getActualValue(), actualValue);

            // Always update alert data to reflect current readings
            alert.setActualValue(actualValue);
            alert.setTriggeringReport(report);
            String updatedMessage = buildAlertMessage(alertType, rack, thresholdValue, actualValue);
            alert.setMessage(updatedMessage);
            alertRepository.save(alert);

            if (moreSevere) {
                log.debug("Alert {} updated with more severe value, redistributing notifications",
                        alert.getId());
                List<User> usersNotified = redistributeNotifications(alert);
                return Optional.of(new AlertNotificationResult(usersNotified, updatedMessage));
            } else {
                // Not more severe — still create notifications for users who don't have one, but no email
                distributeNotifications(alert);
                log.debug("Alert {} data updated (value: {}), not more severe — notifications distributed without email",
                        alert.getId(), actualValue);
                return Optional.empty();
            }
        }

        // Create new alert
        String message = buildAlertMessage(alertType, rack, thresholdValue, actualValue);

        Alert alert = Alert.builder()
                .rack(rack)
                .warehouse(rack.getWarehouse())
                .triggeringReport(report)
                .alertType(alertType)
                .status(AlertStatus.OPEN)
                .message(message)
                .thresholdValue(thresholdValue)
                .actualValue(actualValue)
                .createdAt(Instant.now())
                .build();

        alert = alertRepository.save(alert);
        log.info("Created new alert: type={}, rack={}, alertId={}, message={}", alertType, rack.getId(), alert.getId(), message);

        List<User> usersNotified = distributeNotifications(alert);
        return Optional.of(new AlertNotificationResult(usersNotified, message));
    }

    /**
     * Creates an item-level alert if no active alert of the same type exists for the rack+item combination.
     * If an alert exists and the new value is more severe, updates data and redistributes notifications.
     * If the value is same or less severe, still updates alert data but without notifications or emails.
     *
     * @return Optional with users to email and the alert message (empty if no notifications needed)
     */
    private Optional<AlertNotificationResult> createAlertIfNotExistsForItem(Rack rack, Item item, RackReport report, AlertType alertType,
                                                  float thresholdValue, float actualValue) {
        Optional<Alert> existingAlert = alertRepository.findActiveAlertForRackAndItem(
                rack.getId(), item.getId(), alertType, ACTIVE_STATUSES);

        if (existingAlert.isPresent()) {
            Alert alert = existingAlert.get();
            boolean moreSevere = shouldUpdateAlert(alertType, alert.getActualValue(), actualValue);

            // Always update alert data to reflect current readings
            alert.setActualValue(actualValue);
            alert.setTriggeringReport(report);
            String updatedMessage = buildAlertMessageForItem(alertType, rack, item, thresholdValue, actualValue);
            alert.setMessage(updatedMessage);
            alertRepository.save(alert);

            if (moreSevere) {
                log.debug("Item alert {} updated with more severe value, redistributing notifications",
                        alert.getId());
                List<User> usersNotified = redistributeNotifications(alert);
                return Optional.of(new AlertNotificationResult(usersNotified, updatedMessage));
            } else {
                distributeNotifications(alert);
                log.debug("Item alert {} data updated (value: {}), not more severe — notifications distributed without email",
                        alert.getId(), actualValue);
                return Optional.empty();
            }
        }

        String message = buildAlertMessageForItem(alertType, rack, item, thresholdValue, actualValue);

        Alert alert = Alert.builder()
                .rack(rack)
                .warehouse(rack.getWarehouse())
                .triggeringReport(report)
                .item(item)
                .alertType(alertType)
                .status(AlertStatus.OPEN)
                .message(message)
                .thresholdValue(thresholdValue)
                .actualValue(actualValue)
                .createdAt(Instant.now())
                .build();

        alert = alertRepository.save(alert);
        log.info("Created new item alert: type={}, rack={}, item={}, alertId={}, message={}",
                alertType, rack.getId(), item.getId(), alert.getId(), message);

        List<User> usersNotified = distributeNotifications(alert);
        return Optional.of(new AlertNotificationResult(usersNotified, message));
    }

    /**
     * Creates a weight-based alert if no active alert of the same type exists for the rack.
     * If an alert exists and the new value is more severe, updates data and redistributes notifications.
     * If the value is same or less severe, still updates alert data but without notifications or emails.
     *
     * @return Optional with users to email and the alert message (empty if no notifications needed)
     */
    private Optional<AlertNotificationResult> createAlertIfNotExistsForWeight(Rack rack, RackReport report, AlertType alertType,
                                                    float thresholdValue, float actualValue) {
        Optional<Alert> existingAlert = alertRepository.findActiveAlertForRack(
                rack.getId(), alertType, ACTIVE_STATUSES);

        if (existingAlert.isPresent()) {
            Alert alert = existingAlert.get();
            boolean moreSevere = shouldUpdateAlert(alertType, alert.getActualValue(), actualValue);

            // Always update alert data to reflect current readings
            alert.setActualValue(actualValue);
            alert.setTriggeringReport(report);
            String updatedMessage = buildAlertMessageForWeight(alertType, rack, thresholdValue, actualValue);
            alert.setMessage(updatedMessage);
            alertRepository.save(alert);

            if (moreSevere) {
                log.debug("Weight alert {} updated with more severe value, redistributing notifications",
                        alert.getId());
                List<User> usersNotified = redistributeNotifications(alert);
                return Optional.of(new AlertNotificationResult(usersNotified, updatedMessage));
            } else {
                distributeNotifications(alert);
                log.debug("Weight alert {} data updated (value: {}), not more severe — notifications distributed without email",
                        alert.getId(), actualValue);
                return Optional.empty();
            }
        }

        String message = buildAlertMessageForWeight(alertType, rack, thresholdValue, actualValue);

        Alert alert = Alert.builder()
                .rack(rack)
                .warehouse(rack.getWarehouse())
                .triggeringReport(report)
                .alertType(alertType)
                .status(AlertStatus.OPEN)
                .message(message)
                .thresholdValue(thresholdValue)
                .actualValue(actualValue)
                .createdAt(Instant.now())
                .build();

        alert = alertRepository.save(alert);
        log.info("Created new weight alert: type={}, rack={}, alertId={}, message={}",
                alertType, rack.getId(), alert.getId(), message);

        List<User> usersNotified = distributeNotifications(alert);
        return Optional.of(new AlertNotificationResult(usersNotified, message));
    }

    /**
     * Marks all existing notifications for an alert as unread and ensures all users have notifications.
     * Used when an alert is updated with a more severe value.
     *
     * @return List of users who should receive an email: those whose notifications were re-marked
     *         (read → unread, meaning alert got worse since they last checked) plus new notification recipients
     */
    private List<User> redistributeNotifications(Alert alert) {
        log.info("Redistributing notifications for alert {} - marking all as unread", alert.getId());

        Long warehouseId = alert.getWarehouse().getId();

        // Get all active users assigned to this warehouse
        List<User> activeUsers = userRepository.findByWarehouseIdAndStatusOrAdmin(warehouseId, AccountStatus.ACTIVE);

        // Get existing notifications for this alert
        List<UserNotification> existingNotifications = notificationRepository.findByAlertId(alert.getId());
        Set<Long> usersWithNotifications = existingNotifications.stream()
                .map(n -> n.getUser().getId())
                .collect(Collectors.toSet());

        Instant now = Instant.now();
        List<UserNotification> notificationsToUpdate = new ArrayList<>();
        List<UserNotification> newNotifications = new ArrayList<>();
        List<User> usersToEmail = new ArrayList<>();

        // Mark existing notifications as unread; users who had read theirs get re-notified via email
        existingNotifications.forEach(notification -> {
            if (notification.isRead()) {
                notification.markAsUnread();
                notificationsToUpdate.add(notification);
                usersToEmail.add(notification.getUser());
                log.debug("Marking notification {} as unread for user {} (will re-send email)",
                        notification.getId(), notification.getUser().getId());
            }
        });

        // Create notifications for users who don't have one yet (e.g., new users in warehouse)
        activeUsers.stream()
                .filter(user -> !usersWithNotifications.contains(user.getId()))
                .forEach(user -> {
                    UserNotification notification = UserNotification.builder()
                            .user(user)
                            .alert(alert)
                            .isRead(false)
                            .createdAt(now)
                            .build();
                    newNotifications.add(notification);
                    log.debug("Creating new notification for user {} on alert {}", user.getId(), alert.getId());
                });

        // Save all changes
        if (!notificationsToUpdate.isEmpty()) {
            notificationRepository.saveAll(notificationsToUpdate);
        }
        if (!newNotifications.isEmpty()) {
            notificationRepository.saveAll(newNotifications);
        }

        // Add new notification users to email list
        newNotifications.stream().map(UserNotification::getUser).forEach(usersToEmail::add);

        log.info("Redistributed notifications for alert {}: re-marked {} as unread, created {} new — {} users to email",
                alert.getId(), notificationsToUpdate.size(), newNotifications.size(), usersToEmail.size());

        return usersToEmail;
    }

    /**
     * Distributes notifications for an alert to active users assigned to the alert's warehouse.
     * Uses batch insert and single query check to prevent N+1 problem.
     * <p>
     * Only users with ACTIVE status and assigned to the warehouse receive notifications.
     * This prevents unauthorized access to warehouse data and reduces notification spam.
     *
     * @return List of users who received NEW notifications
     */
    private List<User> distributeNotifications(Alert alert) {
        log.info("Distributing notifications for alert {} in warehouse {}", alert.getId(), alert.getWarehouse().getId());
        Long warehouseId = alert.getWarehouse().getId();

        // Get all active users assigned to this warehouse
        List<User> activeUsers = userRepository.findByWarehouseIdAndStatusOrAdmin(
                warehouseId, AccountStatus.ACTIVE);

        // Batch check: get all user IDs that already have this notification (single query)
        Set<Long> existingUserIds = notificationRepository.findUserIdsWithNotificationForAlert(alert.getId());
        log.debug("Existing notifications for alert {}: {} users already notified", alert.getId(), existingUserIds.size());

        // Build list of notifications to create
        Instant now = Instant.now();
        List<UserNotification> newNotifications = activeUsers.stream()
                .filter(user -> !existingUserIds.contains(user.getId()))
                .map(user -> UserNotification.builder()
                        .user(user)
                        .alert(alert)
                        .isRead(false)
                        .createdAt(now)
                        .build())
                .toList();
        log.info("Prepared {} new notifications for alert {} after filtering existing ones",
                newNotifications.size(), alert.getId());

        // Batch insert: save all notifications in one operation
        if (!newNotifications.isEmpty()) {
            notificationRepository.saveAll(newNotifications);
            log.info("Distributed {} notifications for alert {} to active users",
                    newNotifications.size(), alert.getId());
        } else {
            log.debug("No new notifications to distribute for alert {}", alert.getId());
        }

        return newNotifications.stream().map(UserNotification::getUser).toList();
    }

    /**
     * Collects users and their alert messages into per-user maps for batch email sending.
     */
    private void collectEmailRecipients(AlertNotificationResult result,
                                        Map<Long, User> usersById,
                                        Map<Long, List<String>> userAlertMessages) {
        result.usersToEmail().forEach(user -> {
            usersById.put(user.getId(), user);
            userAlertMessages.computeIfAbsent(user.getId(), k -> new ArrayList<>())
                    .add(result.alertMessage());
        });
    }

    /**
     * Determines if an alert should be updated based on the new actual value.
     * Returns true if the new value is more severe than the existing one.
     */
    private boolean shouldUpdateAlert(AlertType alertType, float existingValue, float newValue) {
        return switch (alertType) {
            // For these alerts, higher values are more severe
            case WEIGHT_EXCEEDED, TEMPERATURE_TOO_HIGH, ITEM_TEMPERATURE_TOO_HIGH -> newValue > existingValue;

            // For these alerts, lower values are more severe
            case TEMPERATURE_TOO_LOW, ITEM_TEMPERATURE_TOO_LOW -> newValue < existingValue;

            // For unauthorized outbound, the difference from threshold is what matters
            // If the new value is further from threshold (more negative difference), it's more severe
            case UNAUTHORIZED_OUTBOUND -> newValue < existingValue;

            // For system alerts, no update logic
            default -> false;
        };
    }

    /**
     * Builds a human-readable alert message
     */
    private String buildAlertMessage(AlertType alertType, Rack rack, float threshold, float actual) {
        String rackInfo = String.format("Regał %s (ID: %d)",
                rack.getMarker() != null ? rack.getMarker() : "bez oznaczenia", rack.getId());

        return switch (alertType) {
            case WEIGHT_EXCEEDED -> String.format(
                    "%s - Przekroczono maksymalną wagę. Limit: %.2f kg, Aktualna: %.2f kg",
                    rackInfo, threshold, actual);
            case TEMPERATURE_TOO_HIGH -> String.format(
                    "%s - Temperatura przekracza maksymalną dopuszczalną. Limit: %.1f°C, Aktualna: %.1f°C",
                    rackInfo, threshold, actual);
            case TEMPERATURE_TOO_LOW -> String.format(
                    "%s - Temperatura poniżej minimalnej dopuszczalnej. Limit: %.1f°C, Aktualna: %.1f°C",
                    rackInfo, threshold, actual);
            case ITEM_TEMPERATURE_TOO_HIGH, ITEM_TEMPERATURE_TOO_LOW -> String.format(
                    "%s - Temperatura regału (%.1f°C) poza zakresem tolerancji przedmiotu",
                    rackInfo, actual);
            case UNAUTHORIZED_OUTBOUND ->
                    throw new IllegalArgumentException("UNAUTHORIZED_OUTBOUND should use buildAlertMessageForWeight");
            case EMBEDDING_GENERATION_COMPLETED, EMBEDDING_GENERATION_FAILED,
                 ASSORTMENT_EXPIRED, ASSORTMENT_CLOSE_TO_EXPIRY,
                 BACKUP_COMPLETED, BACKUP_FAILED,
                 RESTORE_COMPLETED, RESTORE_FAILED, ADMIN_MESSAGE ->
                    throw new IllegalArgumentException("System alert types should not be used in rack reports");
        };
    }

    /**
     * Builds a human-readable alert message for weight-based alerts (like unauthorized outbound)
     */
    private String buildAlertMessageForWeight(AlertType alertType, Rack rack, float threshold, float actual) {
        String rackInfo = String.format("Regał %s (ID: %d)",
                rack.getMarker() != null ? rack.getMarker() : "bez oznaczenia", rack.getId());

        return switch (alertType) {
            case UNAUTHORIZED_OUTBOUND -> String.format(
                    "%s - Nieautoryzowany outflow. Oczekiwana waga: %.2f kg, Aktualna waga: %.2f kg. " +
                            "Różnica: %.2f kg",
                    rackInfo, threshold, actual, threshold - actual);
            default -> buildAlertMessage(alertType, rack, threshold, actual);
        };
    }

    /**
     * Builds a human-readable alert message for item-level alerts
     */
    private String buildAlertMessageForItem(AlertType alertType, Rack rack, Item item, float threshold, float actual) {
        String rackInfo = String.format("Regał %s (ID: %d)",
                rack.getMarker() != null ? rack.getMarker() : "bez oznaczenia", rack.getId());

        return switch (alertType) {
            case ITEM_TEMPERATURE_TOO_HIGH -> String.format(
                    "%s - Temperatura regału (%.1f°C) przekracza maksymalną tolerancję przedmiotu '%s' (ID: %d). " +
                            "Maks. dopuszczalna: %.1f°C",
                    rackInfo, actual, item.getName(), item.getId(), item.getMax_temp());
            case ITEM_TEMPERATURE_TOO_LOW -> String.format(
                    "%s - Temperatura regału (%.1f°C) poniżej minimalnej tolerancji przedmiotu '%s' (ID: %d). " +
                            "Min. dopuszczalna: %.1f°C",
                    rackInfo, actual, item.getName(), item.getId(), item.getMin_temp());
            default -> buildAlertMessage(alertType, rack, threshold, actual);
        };
    }

    /**
     * Get all reports with pagination
     */
    public Page<RackReportDto> getAllReportsPaged(HttpServletRequest httpRequest, Pageable pageable) {
        rateLimiter.consumeOrThrow(getClientIp(httpRequest), RateLimitOperation.INVENTORY_READ);
        return reportRepository.findAll(pageable).map(this::mapToDto);
    }

    /**
     * Get reports for a specific rack
     */
    public Page<RackReportDto> getReportsByRackPaged(Long rackId, HttpServletRequest httpRequest, Pageable pageable) {
        rateLimiter.consumeOrThrow(getClientIp(httpRequest), RateLimitOperation.INVENTORY_READ);
        return reportRepository.findByRackId(rackId, pageable).map(this::mapToDto);
    }

    /**
     * Get reports for a specific warehouse
     */
    public Page<RackReportDto> getReportsByWarehousePaged(Long warehouseId, HttpServletRequest httpRequest, Pageable pageable) {
        rateLimiter.consumeOrThrow(getClientIp(httpRequest), RateLimitOperation.INVENTORY_READ);
        return reportRepository.findByWarehouseId(warehouseId, pageable).map(this::mapToDto);
    }

    /**
     * Get reports that triggered alerts
     */
    public Page<RackReportDto> getReportsWithAlerts(HttpServletRequest httpRequest, Pageable pageable) {
        rateLimiter.consumeOrThrow(getClientIp(httpRequest), RateLimitOperation.INVENTORY_READ);
        return reportRepository.findByAlertTriggeredTrue(pageable).map(this::mapToDto);
    }

    /**
     * Maps RackReport entity to DTO
     */
    private RackReportDto mapToDto(RackReport report) {
        Rack rack = report.getRack();
        Warehouse warehouse = rack.getWarehouse();

        return RackReportDto.builder()
                .id(report.getId())
                .rackId(rack.getId())
                .rackMarker(rack.getMarker())
                .warehouseId(warehouse != null ? warehouse.getId() : null)
                .warehouseName(warehouse != null ? warehouse.getName() : null)
                .currentWeight(report.getCurrentWeight())
                .currentTemperature(report.getCurrentTemperature())
                .sensorId(report.getSensorId())
                .alertTriggered(report.isAlertTriggered())
                .createdAt(report.getCreatedAt())
                .build();
    }
}
