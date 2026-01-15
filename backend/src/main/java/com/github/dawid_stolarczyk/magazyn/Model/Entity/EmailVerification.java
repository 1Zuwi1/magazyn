package com.github.dawid_stolarczyk.magazyn.Model.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "email_verifications")
@Getter
@Setter
public class EmailVerification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private String verificationToken;
    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    private boolean verified = false;
    private Instant expiresAt;
}
