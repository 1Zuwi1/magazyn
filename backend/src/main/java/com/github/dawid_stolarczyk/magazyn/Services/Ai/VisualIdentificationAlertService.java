package com.github.dawid_stolarczyk.magazyn.Services.Ai;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.Alert;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Item;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AlertStatus;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AlertType;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.AlertRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service for managing alerts related to visual identification.
 * Implements idempotent alert creation to avoid duplicate alerts.
 * Thread-safe using synchronized methods to prevent race conditions.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VisualIdentificationAlertService {

    private final AlertRepository alertRepository;
    private final Object alertCreationLock = new Object();

    private static final List<AlertStatus> ACTIVE_STATUSES = List.of(
            AlertStatus.OPEN,
            AlertStatus.ACTIVE
    );

    /**
     * Creates a low similarity alert if no open alert exists for the same context.
     * Implements idempotent behavior by checking for existing open alerts.
     * Thread-safe: uses synchronized block to prevent race conditions when creating alerts.
     *
     * @param item            the matched item
     * @param similarityScore the actual similarity score
     * @param threshold       the configured threshold
     * @param user            the user who triggered the identification (may be null)
     * @return true if a new alert was created, false if an existing alert was found
     */
    @Transactional
    public boolean createLowSimilarityAlertIfNeeded(Item item, double similarityScore,
                                                    double threshold, User user) {
        if (item == null || item.getAssortments() == null || item.getAssortments().isEmpty()) {
            log.debug("Item has no rack assignments, skipping alert creation");
            return false;
        }

        // Use the first (primary) rack assignment for alert generation.
        // For items with multiple rack placements, the alert is associated with
        // the primary storage location. In most WMS scenarios, the first assortment
        // represents the primary storage position.
        var assortment = item.getAssortments().get(0);
        if (assortment.getRack() == null) {
            log.debug("Item assortment has no rack, skipping alert creation");
            return false;
        }

        var rack = assortment.getRack();
        Long rackId = rack.getId();

        // Synchronized block to prevent race condition between check and insert
        synchronized (alertCreationLock) {
            // Check for existing open alert (idempotency check)
            boolean existingAlert = alertRepository.existsActiveAlertForRack(
                    rackId,
                    AlertType.LOW_VISUAL_SIMILARITY,
                    ACTIVE_STATUSES
            );

            if (existingAlert) {
                log.debug("Active alert already exists for rack {} and alert type LOW_VISUAL_SIMILARITY", rackId);
                return false;
            }

            // Create new alert
            String message = String.format(
                    "Low visual similarity (%.1f%%) for item '%s' (ID: %d). " +
                            "Threshold: %.1f%%. Manual verification recommended.",
                    similarityScore * 100,
                    item.getName(),
                    item.getId(),
                    threshold * 100
            );

            Alert alert = Alert.builder()
                    .rack(rack)
                    .warehouse(rack.getWarehouse())
                    .alertType(AlertType.LOW_VISUAL_SIMILARITY)
                    .status(AlertStatus.OPEN)
                    .message(message)
                    .thresholdValue((float) threshold)
                    .actualValue((float) similarityScore)
                    .build();

            alertRepository.save(alert);
            log.info("Created LOW_VISUAL_SIMILARITY alert for item {} with score {} on rack {}",
                    item.getId(), similarityScore, rackId);

            return true;
        }
    }

    /**
     * Finds an existing open alert for visual identification for a specific rack.
     */
    public Optional<Alert> findExistingOpenAlert(Long rackId) {
        return alertRepository.findActiveAlertForRack(
                rackId,
                AlertType.LOW_VISUAL_SIMILARITY,
                ACTIVE_STATUSES
        );
    }
}
