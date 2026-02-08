package com.github.dawid_stolarczyk.magazyn.Scheduler;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.*;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AccountStatus;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AlertStatus;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AlertType;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class ExpirationAlertTask {

    private static final List<AlertStatus> ACTIVE_STATUSES = Arrays.asList(AlertStatus.OPEN, AlertStatus.ACTIVE);

    private final AssortmentRepository assortmentRepository;
    private final AlertRepository alertRepository;
    private final UserRepository userRepository;
    private final UserNotificationRepository notificationRepository;

    @Value("${app.expiration.close-to-expiry-days:2}")
    private int closeToExpiryDays;

    @Scheduled(cron = "${app.expiration.check-cron:0 0 6 * * *}")
    @Transactional(rollbackFor = Exception.class)
    public void checkExpirations() {
        log.info("Starting scheduled expiration alert check");

        int expiredAlerts = processExpiredAssortments();
        int closeToExpiryAlerts = processCloseToExpiryAssortments();

        log.info("Expiration alert check completed - expired alerts created: {}, close-to-expiry alerts created: {}",
                expiredAlerts, closeToExpiryAlerts);
    }

    private int processExpiredAssortments() {
        List<Assortment> expired = assortmentRepository.findAllExpired();
        if (expired.isEmpty()) {
            return 0;
        }

        Map<RackItemKey, List<Assortment>> grouped = groupByRackAndItem(expired);
        int alertsCreated = 0;

        for (Map.Entry<RackItemKey, List<Assortment>> entry : grouped.entrySet()) {
            RackItemKey key = entry.getKey();
            List<Assortment> assortments = entry.getValue();

            if (alertRepository.existsActiveAlertForRackAndItem(
                    key.rackId, key.itemId, AlertType.ASSORTMENT_EXPIRED, ACTIVE_STATUSES)) {
                continue;
            }

            Assortment sample = assortments.get(0);
            String message = buildExpirationMessage(sample.getRack(), sample.getItem(), assortments.size());

            Alert alert = createAlert(sample.getRack(), sample.getItem(), AlertType.ASSORTMENT_EXPIRED, message);
            distributeNotifications(alert);
            alertsCreated++;
        }

        return alertsCreated;
    }

    private int processCloseToExpiryAssortments() {
        Timestamp threshold = Timestamp.from(Instant.now().plus(closeToExpiryDays, ChronoUnit.DAYS));
        List<Assortment> closeToExpiry = assortmentRepository.findAllCloseToExpiry(threshold);
        if (closeToExpiry.isEmpty()) {
            return 0;
        }

        Map<RackItemKey, List<Assortment>> grouped = groupByRackAndItem(closeToExpiry);
        int alertsCreated = 0;

        for (Map.Entry<RackItemKey, List<Assortment>> entry : grouped.entrySet()) {
            RackItemKey key = entry.getKey();
            List<Assortment> assortments = entry.getValue();

            if (alertRepository.existsActiveAlertForRackAndItem(
                    key.rackId, key.itemId, AlertType.ASSORTMENT_CLOSE_TO_EXPIRY, ACTIVE_STATUSES)) {
                continue;
            }

            Assortment sample = assortments.get(0);
            String message = buildCloseToExpiryMessage(sample.getRack(), sample.getItem(),
                    assortments.size(), closeToExpiryDays);

            Alert alert = createAlert(sample.getRack(), sample.getItem(), AlertType.ASSORTMENT_CLOSE_TO_EXPIRY, message);
            distributeNotifications(alert);
            alertsCreated++;
        }

        return alertsCreated;
    }

    private Map<RackItemKey, List<Assortment>> groupByRackAndItem(List<Assortment> assortments) {
        return assortments.stream()
                .collect(Collectors.groupingBy(a -> new RackItemKey(a.getRack().getId(), a.getItem().getId())));
    }

    private Alert createAlert(Rack rack, Item item, AlertType alertType, String message) {
        Alert alert = Alert.builder()
                .rack(rack)
                .warehouse(rack.getWarehouse())
                .item(item)
                .alertType(alertType)
                .status(AlertStatus.OPEN)
                .message(message)
                .createdAt(Instant.now())
                .build();

        alert = alertRepository.save(alert);
        log.info("Created expiration alert: type={}, rack={}, item={}", alertType, rack.getId(), item.getId());
        return alert;
    }

    private void distributeNotifications(Alert alert) {
        Long warehouseId = alert.getWarehouse().getId();

        List<User> activeUsers = userRepository.findByWarehouseIdAndStatus(warehouseId, AccountStatus.ACTIVE);
        Set<Long> existingUserIds = notificationRepository.findUserIdsWithNotificationForAlert(alert.getId());

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

        if (!newNotifications.isEmpty()) {
            notificationRepository.saveAll(newNotifications);
            log.info("Distributed {} notifications for expiration alert {}", newNotifications.size(), alert.getId());
        }
    }

    private String buildExpirationMessage(Rack rack, Item item, int count) {
        String rackInfo = String.format("Rega\u0142 %s (ID: %d)",
                rack.getMarker() != null ? rack.getMarker() : "bez oznaczenia", rack.getId());
        return String.format("%s - %d szt. produktu '%s' (ID: %d) przekroczy\u0142o dat\u0119 wa\u017Cno\u015Bci",
                rackInfo, count, item.getName(), item.getId());
    }

    private String buildCloseToExpiryMessage(Rack rack, Item item, int count, int days) {
        String rackInfo = String.format("Rega\u0142 %s (ID: %d)",
                rack.getMarker() != null ? rack.getMarker() : "bez oznaczenia", rack.getId());
        return String.format("%s - %d szt. produktu '%s' (ID: %d) wygasa w ci\u0105gu %d dni",
                rackInfo, count, item.getName(), item.getId(), days);
    }

    private record RackItemKey(Long rackId, Long itemId) {}
}
