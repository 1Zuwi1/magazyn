package com.github.dawid_stolarczyk.magazyn.Model.Repositories;

import com.github.dawid_stolarczyk.magazyn.Model.Entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
}
