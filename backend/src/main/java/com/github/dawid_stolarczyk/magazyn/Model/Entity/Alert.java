package com.github.dawid_stolarczyk.magazyn.Model.Entity;

import com.github.dawid_stolarczyk.magazyn.Model.Enums.AlertStatus;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AlertType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing a system-wide alert/notification about rack anomalies.
 * This is the global alert entity - individual user read status is tracked in UserNotification.
 */
@Entity
@Table(name = "alerts", indexes = {
        @Index(name = "idx_alerts_rack_id", columnList = "rack_id"),
        @Index(name = "idx_alerts_status", columnList = "status"),
        @Index(name = "idx_alerts_type_status", columnList = "alertType, status"),
        @Index(name = "idx_alerts_warehouse_id", columnList = "warehouse_id"),
        @Index(name = "idx_alerts_item_id", columnList = "item_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The rack that triggered this alert
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rack_id", nullable = false)
    private Rack rack;

    /**
     * The warehouse where the rack is located (denormalized for faster queries)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    /**
     * The report that triggered this alert
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id")
    private RackReport triggeringReport;

    /**
     * The item associated with this alert (optional, for item-level alerts like ITEM_TEMPERATURE_VIOLATION)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id")
    private Item item;

    /**
     * Type of the alert (what went wrong)
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private AlertType alertType;

    /**
     * Current status of the alert
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private AlertStatus status = AlertStatus.OPEN;

    /**
     * Human-readable message describing the alert
     */
    @Column(nullable = false, length = 500)
    private String message;

    /**
     * The threshold value that was exceeded (for reference)
     */
    private Float thresholdValue;

    /**
     * The actual measured value that caused the alert
     */
    private Float actualValue;

    /**
     * When the alert was created
     */
    @Column(nullable = false)
    private Instant createdAt;

    /**
     * When the alert was last updated (status change, etc.)
     */
    private Instant updatedAt;

    /**
     * When the alert was resolved (if applicable)
     */
    private Instant resolvedAt;

    /**
     * User who resolved the alert (if applicable)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by_user_id")
    private User resolvedBy;

    /**
     * Optional resolution notes
     */
    @Column(length = 1000)
    private String resolutionNotes;

    /**
     * User notifications for this alert (tracking read status per user)
     */
    @OneToMany(mappedBy = "alert", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<UserNotification> userNotifications = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    /**
     * Marks the alert as resolved
     */
    public void resolve(User resolvedByUser, String notes) {
        this.status = AlertStatus.RESOLVED;
        this.resolvedAt = Instant.now();
        this.resolvedBy = resolvedByUser;
        this.resolutionNotes = notes;
    }

    /**
     * Marks the alert as dismissed
     */
    public void dismiss(User dismissedByUser, String notes) {
        this.status = AlertStatus.DISMISSED;
        this.resolvedAt = Instant.now();
        this.resolvedBy = dismissedByUser;
        this.resolutionNotes = notes;
    }
}
