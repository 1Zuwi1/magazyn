package com.github.dawid_stolarczyk.magazyn.Repositories.JPA;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.PasswordResetToken;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByResetToken(String resetToken);

    void deleteByUser(User user);
}
