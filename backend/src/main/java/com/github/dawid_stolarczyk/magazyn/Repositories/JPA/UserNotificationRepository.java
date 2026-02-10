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
import java.util.Set;

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
     * Find notification by user and alert
     */
    Optional<UserNotification> findByUserIdAndAlertId(Long userId, Long alertId);


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
     * Get all user IDs that already have a notification for the given alert.
     * Used for batch notification distribution to avoid N+1 queries.
     */
    @Query("SELECT n.user.id FROM UserNotification n WHERE n.alert.id = :alertId")
    Set<Long> findUserIdsWithNotificationForAlert(@Param("alertId") Long alertId);
}
