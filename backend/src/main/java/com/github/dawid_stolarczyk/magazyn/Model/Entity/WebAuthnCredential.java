package com.github.dawid_stolarczyk.magazyn.Model.Entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "webauthn_credential",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"userHandle", "name"})
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebAuthnCredential {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    // ID credentiala (Base64Url)
    @Column(nullable = false, unique = true)
    private String credentialId;

    // Klucz publiczny w formacie COSE (Base64Url)
    @Column(nullable = false, length = 2048)
    private String publicKeyCose;

    // Counter podpisu (do ochrony przed replay attack)
    @Column(nullable = false)
    private Long signatureCount;

    // userHandle powiązany z kontem (Base64Url)
    @Column(nullable = false)
    private String userHandle;

    // Email właściciela credentiala (potrzebny dla SDK i mapowania username)
    @Column(nullable = false)
    private String email;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Flaga czy credential jest discoverable (passkey)
    @Column
    private Boolean isDiscoverable;

}
