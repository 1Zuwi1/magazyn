package com.github.dawid_stolarczyk.magazyn.Repositories.JPA;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AccountStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Optional<User> findByUserHandle(String userHandle);

    Page<User> findByIdNot(Long id, Pageable pageable);

    /**
     * Find users with optional filtering by name, email, and status
     * Excludes the specified user ID (typically current admin)
     */
    @Query("SELECT u FROM User u WHERE u.id <> :excludeId " +
            "AND (:name IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :name, '%'))) " +
            "AND (:email IS NULL OR LOWER(u.email) LIKE LOWER(CONCAT('%', :email, '%'))) " +
            "AND (:status IS NULL OR u.status = :status)")
    Page<User> findUsersWithFilters(
            @Param("excludeId") Long excludeId,
            @Param("name") String name,
            @Param("email") String email,
            @Param("status") AccountStatus status,
            Pageable pageable);
}
