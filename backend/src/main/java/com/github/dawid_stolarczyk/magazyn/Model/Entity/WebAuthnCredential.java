package com.github.dawid_stolarczyk.magazyn.Model.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "webauthn_credentials")
@Getter
@Setter
public class WebAuthnCredential {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, unique = true)
    private byte[] credentialId;

    @Column(nullable = false)
    private byte[] publicKey;

    private long signatureCount;

    private String transports; // USB, BLE, INTERNAL

    private boolean isFor2FA; // true jeśli 2FA, false jeśli passwordless
}
