package com.github.dawid_stolarczyk.magazyn.Repositories.JPA;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.UserNotification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserNotificationRepository extends JpaRepository<UserNotification, Long> {

    /**
     * Find all notifications for a user with pagination
     */
    Page<UserNotification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /**
     * Find unread notifications for a user
     */
    Page<UserNotification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /**
     * Find read notifications for a user
     */
    Page<UserNotification> findByUserIdAndIsReadTrueOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /**
     * Find notification by user and alert
     */
    Optional<UserNotification> findByUserIdAndAlertId(Long userId, Long alertId);

    /**
     * Check if notification exists for user and alert
     */
    boolean existsByUserIdAndAlertId(Long userId, Long alertId);

    /**
     * Count unread notifications for a user
     */
    long countByUserIdAndIsReadFalse(Long userId);

    /**
     * Count all notifications for a user
     */
    long countByUserId(Long userId);

    /**
     * Mark all notifications as read for a user
     */
    @Modifying
    @Query("UPDATE UserNotification n SET n.isRead = true, n.readAt = :now WHERE n.user.id = :userId AND n.isRead = false")
    int markAllAsReadForUser(@Param("userId") Long userId, @Param("now") Instant now);

    /**
     * Find all notifications for a specific alert
     */
    List<UserNotification> findByAlertId(Long alertId);

    /**
     * Delete all notifications for a user
     */
    @Modifying
    @Query("DELETE FROM UserNotification n WHERE n.user.id = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);

    /**
     * Delete all notifications for an alert
     */
    @Modifying
    @Query("DELETE FROM UserNotification n WHERE n.alert.id = :alertId")
    void deleteAllByAlertId(@Param("alertId") Long alertId);
}
