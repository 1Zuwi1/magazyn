package com.github.dawid_stolarczyk.magazyn.Model.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Entity tracking individual user's read/notification status for alerts.
 * Allows each user to independently mark alerts as read/unread.
 */
@Entity
@Table(name = "user_notifications",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"user_id", "alert_id"})
        },
        indexes = {
                @Index(name = "idx_user_notifications_user_id", columnList = "user_id"),
                @Index(name = "idx_user_notifications_alert_id", columnList = "alert_id"),
                @Index(name = "idx_user_notifications_read", columnList = "user_id, isRead")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The user this notification belongs to
     */
    @ManyToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * The alert this notification is for
     */
    @ManyToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinColumn(name = "alert_id", nullable = false)
    private Alert alert;

    /**
     * Whether the user has read this notification
     */
    @Column(nullable = false)
    @Builder.Default
    private boolean isRead = false;

    /**
     * When the notification was created (sent to user)
     */
    @Column(nullable = false)
    private Instant createdAt;

    /**
     * When the user read this notification (if read)
     */
    private Instant readAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    /**
     * Marks this notification as read
     */
    public void markAsRead() {
        if (!this.isRead) {
            this.isRead = true;
            this.readAt = Instant.now();
        }
    }

    /**
     * Marks this notification as unread
     */
    public void markAsUnread() {
        this.isRead = false;
        this.readAt = null;
    }
}
