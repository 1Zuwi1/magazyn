package com.github.dawid_stolarczyk.magazyn.Model.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Entity for logging image recognition (visual identification) attempts.
 * Records who performed the identification, when, and the result.
 */
@Entity
@Table(name = "audit_logs", indexes = {
        @Index(name = "idx_audit_logs_user_id", columnList = "user_id"),
        @Index(name = "idx_audit_logs_created_at", columnList = "created_at"),
        @Index(name = "idx_audit_logs_action_type", columnList = "action_type"),
        @Index(name = "idx_audit_logs_item_id", columnList = "matched_item_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The user who performed the action
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    /**
     * Type of action being audited
     */
    @Column(name = "action_type", nullable = false, length = 50)
    private String actionType;

    /**
     * The item that was matched (for visual identification)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "matched_item_id")
    private Item matchedItem;

    /**
     * Similarity score (0.0 - 1.0) for visual identification
     */
    @Column(name = "similarity_score")
    private Double similarityScore;

    /**
     * Whether the operation was successful
     */
    @Column(name = "success", nullable = false)
    private boolean success;

    /**
     * Error message if the operation failed
     */
    @Column(name = "error_message", length = 500)
    private String errorMessage;

    /**
     * Original filename of the uploaded image (for reference)
     */
    @Column(name = "original_filename", length = 255)
    private String originalFilename;

    /**
     * IP address of the requester
     */
    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    /**
     * User agent string from the request
     */
    @Column(name = "user_agent", length = 500)
    private String userAgent;

    /**
     * When the action was performed
     */
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    /**
     * Additional details or context (JSON format)
     */
    @Column(name = "details", length = 2000)
    private String details;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    /**
     * Constant for image identification action type
     */
    public static final String ACTION_IMAGE_IDENTIFICATION = "IMAGE_IDENTIFICATION";
}
