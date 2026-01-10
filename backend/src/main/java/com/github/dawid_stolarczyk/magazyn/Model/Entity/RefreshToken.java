package com.github.dawid_stolarczyk.magazyn.Model.Entity;

import com.github.dawid_stolarczyk.magazyn.Model.Enums.Status2FA;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "refresh_tokens")
@Getter
@Setter
public class RefreshToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String token;
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    private Instant expiresAt;
    private boolean revoked = false;
    private Status2FA status2FA;
}
