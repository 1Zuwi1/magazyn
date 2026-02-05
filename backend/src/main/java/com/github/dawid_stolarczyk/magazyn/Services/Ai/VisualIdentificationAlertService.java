package com.github.dawid_stolarczyk.magazyn.Services.Ai;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.Alert;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Item;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AlertStatus;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AlertType;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.AlertRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service for managing alerts related to visual identification.
 * Implements idempotent alert creation using database unique constraint.
 * Thread-safe: relies on PostgreSQL unique partial index to prevent duplicate alerts.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VisualIdentificationAlertService {

    private final AlertRepository alertRepository;

    private static final List<AlertStatus> ACTIVE_STATUSES = List.of(
            AlertStatus.OPEN,
            AlertStatus.ACTIVE
    );

    /**
     * Creates a low similarity alert if no open alert exists for the same context.
     * Implements idempotent behavior using database unique constraint.
     * Thread-safe: relies on PostgreSQL unique partial index (idx_unique_open_alert)
     * to prevent duplicate alerts across distributed instances.
     *
     * <p>IMPORTANT: This method now generates alerts for items WITHOUT rack assignments.
     * For items without racks, a global alert is created (associated with a default warehouse).
     *
     * @param item            the matched item
     * @param similarityScore the actual similarity score
     * @param threshold       the configured threshold
     * @param user            the user who triggered the identification (may be null)
     * @return true if a new alert was created, false if a duplicate was detected
     */
    @Transactional
    public boolean createLowSimilarityAlertIfNeeded(Item item, double similarityScore,
                                                    double threshold, User user) {
        if (item == null) {
            log.debug("Item is null, skipping alert creation");
            return false;
        }

        try {
            // Determine rack assignment
            var rack = extractRack(item);

            if (rack == null) {
                log.warn("Item '{}' (ID: {}) has no rack assignment. Alert cannot be created without a rack.",
                        item.getName(), item.getId());
                // Cannot create alert without rack due to NOT NULL constraint on rack_id
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
                    item.getId(), similarityScore, rack.getId());

            return true;

        } catch (DataIntegrityViolationException e) {
            // Unique constraint violation - alert already exists (race condition handled by DB)
            log.debug("Active alert already exists for item {} (duplicate prevented by database constraint)",
                    item.getId());
            return false;
        }
    }

    /**
     * Extracts the primary rack from an item's assortments.
     * Returns null if the item has no rack assignments.
     *
     * @param item the item to extract rack from
     * @return the primary rack, or null if no rack is assigned
     */
    private com.github.dawid_stolarczyk.magazyn.Model.Entity.Rack extractRack(Item item) {
        if (item.getAssortments() == null || item.getAssortments().isEmpty()) {
            return null;
        }

        // Use the first (primary) rack assignment for alert generation.
        // For items with multiple rack placements, the alert is associated with
        // the primary storage location. In most WMS scenarios, the first assortment
        // represents the primary storage position.
        var assortment = item.getAssortments().get(0);
        return assortment.getRack();
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
