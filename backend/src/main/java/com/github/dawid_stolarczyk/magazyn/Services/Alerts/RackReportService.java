package com.github.dawid_stolarczyk.magazyn.Services.Alerts;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.RackReportDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.RackReportRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.RackReportResponse;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.*;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AccountStatus;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AlertStatus;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AlertType;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.*;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.RateLimitOperation;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

import static com.github.dawid_stolarczyk.magazyn.Utils.InternetUtils.getClientIp;

/**
 * Service for processing rack reports and generating alerts.
 * Implements deduplication logic to avoid spam notifications.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RackReportService {

    private static final List<AlertStatus> ACTIVE_STATUSES = Arrays.asList(AlertStatus.OPEN, AlertStatus.ACTIVE);

    private final RackReportRepository reportRepository;
    private final RackRepository rackRepository;
    private final AlertRepository alertRepository;
    private final AssortmentRepository assortmentRepository;
    private final UserRepository userRepository;
    private final UserNotificationRepository notificationRepository;
    private final Bucket4jRateLimiter rateLimiter;

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

        // Check weight
        if (request.getCurrentWeight() > rack.getMax_weight()) {
            boolean alertCreated = createAlertIfNotExists(rack, report, AlertType.WEIGHT_EXCEEDED,
                    rack.getMax_weight(), request.getCurrentWeight());
            if (alertCreated) {
                triggeredAlerts.add(AlertType.WEIGHT_EXCEEDED);
            }
        }

        // Check temperature too high
        if (request.getCurrentTemperature() > rack.getMax_temp()) {
            boolean alertCreated = createAlertIfNotExists(rack, report, AlertType.TEMPERATURE_TOO_HIGH,
                    rack.getMax_temp(), request.getCurrentTemperature());
            if (alertCreated) {
                triggeredAlerts.add(AlertType.TEMPERATURE_TOO_HIGH);
            }
        }

        // Check temperature too low
        if (request.getCurrentTemperature() < rack.getMin_temp()) {
            boolean alertCreated = createAlertIfNotExists(rack, report, AlertType.TEMPERATURE_TOO_LOW,
                    rack.getMin_temp(), request.getCurrentTemperature());
            if (alertCreated) {
                triggeredAlerts.add(AlertType.TEMPERATURE_TOO_LOW);
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
                boolean created = createAlertIfNotExistsForItem(rack, item, report,
                        AlertType.ITEM_TEMPERATURE_TOO_HIGH, item.getMax_temp(), currentTemp);
                if (created) triggeredAlerts.add(AlertType.ITEM_TEMPERATURE_TOO_HIGH);
            }
            if (currentTemp < item.getMin_temp()) {
                boolean created = createAlertIfNotExistsForItem(rack, item, report,
                        AlertType.ITEM_TEMPERATURE_TOO_LOW, item.getMin_temp(), currentTemp);
                if (created) triggeredAlerts.add(AlertType.ITEM_TEMPERATURE_TOO_LOW);
            }
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
     * Creates an alert if no active alert of the same type exists for the rack.
     * Also distributes notifications to all users in the warehouse.
     *
     * @return true if a new alert was created, false if one already existed
     */
    private boolean createAlertIfNotExists(Rack rack, RackReport report, AlertType alertType,
                                           float thresholdValue, float actualValue) {
        // Check if active alert already exists
        if (alertRepository.existsActiveAlertForRack(rack.getId(), alertType, ACTIVE_STATUSES)) {
            log.debug("Active alert of type {} already exists for rack {}, skipping", alertType, rack.getId());
            return false;
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

        alertRepository.save(alert);
        log.info("Created new alert: type={}, rack={}, message={}", alertType, rack.getId(), message);

        // Distribute notifications to all users
        distributeNotifications(alert);

        return true;
    }

    /**
     * Creates an item-level alert if no active alert of the same type exists for the rack+item combination.
     *
     * @return true if a new alert was created, false if one already existed
     */
    private boolean createAlertIfNotExistsForItem(Rack rack, Item item, RackReport report, AlertType alertType,
                                                  float thresholdValue, float actualValue) {
        if (alertRepository.existsActiveAlertForRackAndItem(rack.getId(), item.getId(), alertType, ACTIVE_STATUSES)) {
            log.debug("Active alert of type {} already exists for rack {} and item {}, skipping",
                    alertType, rack.getId(), item.getId());
            return false;
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

        alertRepository.save(alert);
        log.info("Created new item alert: type={}, rack={}, item={}, message={}", alertType, rack.getId(), item.getId(), message);

        distributeNotifications(alert);

        return true;
    }

    /**
     * Distributes notifications for an alert to active users assigned to the alert's warehouse.
     * Uses batch insert and single query check to prevent N+1 problem.
     * <p>
     * Only users with ACTIVE status and assigned to the warehouse receive notifications.
     * This prevents unauthorized access to warehouse data and reduces notification spam.
     */
    private void distributeNotifications(Alert alert) {
        Long warehouseId = alert.getWarehouse().getId();

        // Get active users assigned to this warehouse
        List<User> activeUsers = userRepository.findByWarehouseIdAndStatus(
                warehouseId, AccountStatus.ACTIVE);

        // Batch check: get all user IDs that already have this notification (single query)
        Set<Long> existingUserIds = notificationRepository.findUserIdsWithNotificationForAlert(alert.getId());

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

        // Batch insert: save all notifications in one operation
        if (!newNotifications.isEmpty()) {
            notificationRepository.saveAll(newNotifications);
            log.info("Distributed {} notifications for alert {} to active users",
                    newNotifications.size(), alert.getId());
        } else {
            log.debug("No new notifications to distribute for alert {}", alert.getId());
        }
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
            case LOW_VISUAL_SIMILARITY -> String.format(
                    "%s - Niski wynik podobieństwa wizualnego. Próg: %.1f%%, Aktualny: %.1f%%",
                    rackInfo, threshold * 100, actual * 100);
            case ITEM_TEMPERATURE_TOO_HIGH, ITEM_TEMPERATURE_TOO_LOW -> String.format(
                    "%s - Temperatura regału (%.1f°C) poza zakresem tolerancji przedmiotu",
                    rackInfo, actual);
            case EMBEDDING_GENERATION_COMPLETED, EMBEDDING_GENERATION_FAILED ->
                    throw new IllegalArgumentException("System alert types should not be used in rack reports");
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
