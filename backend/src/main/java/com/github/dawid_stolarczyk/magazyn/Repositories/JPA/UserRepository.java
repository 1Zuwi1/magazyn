package com.github.dawid_stolarczyk.magazyn.Repositories.JPA;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AccountStatus;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Optional<User> findByUserHandle(String userHandle);

    Page<User> findByIdNot(Long id, Pageable pageable);

    boolean existsByPhone(String phone);

    /**
     * Find users with optional filtering by name, email, and status
     * Excludes the specified user ID (typically current admin)
     */
    @Query("SELECT u FROM User u WHERE u.id <> :excludeId " +
            "AND (:namePattern IS NULL OR LOWER(u.fullName) LIKE :namePattern) " +
            "AND (:emailPattern IS NULL OR LOWER(u.email) LIKE :emailPattern) " +
            "AND (:status IS NULL OR u.status = :status)")
    Page<User> findUsersWithFilters(
            @Param("excludeId") Long excludeId,
            @Param("namePattern") String namePattern,
            @Param("emailPattern") String emailPattern,
            @Param("status") AccountStatus status,
            Pageable pageable);

    /**
     * Find all active users (for notification distribution)
     */
    List<User> findByStatus(AccountStatus status);

    /**
     * Find active users assigned to a specific warehouse or admin.
     * Used for warehouse-based notification filtering.
     */
    @Query("SELECT DISTINCT u FROM User u LEFT JOIN u.assignedWarehouses w " +
            "WHERE u.status = :status AND (w.id = :warehouseId OR u.role = 'ADMIN')")
    List<User> findByWarehouseIdAndStatusOrAdmin(
            @Param("warehouseId") Long warehouseId,
            @Param("status") AccountStatus status);

    /**
     * Find users by role and status.
     * Used for system-wide notifications to specific user roles (e.g., admins).
     */
    List<User> findByRoleAndStatus(UserRole role, AccountStatus status);
}
