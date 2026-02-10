package com.github.dawid_stolarczyk.magazyn.Model.Entity;

import com.github.dawid_stolarczyk.magazyn.Model.Enums.*;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import org.springframework.security.crypto.bcrypt.BCrypt;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "users")
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;
    @Column(nullable = false, unique = true)
    @NotBlank
    @Size(max = 100)
    private String email;
    @Column(nullable = false)
    @NotBlank
    @Size(min = 3, max = 100)
    private String fullName;
    @Column(nullable = false)
    @NotBlank
    private String password;
    @Column(nullable = false, unique = true, length = 64)
    private String userHandle; // Base64Url
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private UserRole role = UserRole.USER;
    @Column(length = 60)
    private String verifyCode;
    private Timestamp verifyCodeGeneratedAt;
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private EmailVerification emailVerifications;
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<WebAuthnCredential> webAuthnCredentials = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, columnDefinition = "varchar(20)")
    private AccountStatus status = AccountStatus.PENDING_VERIFICATION;

    @Enumerated(EnumType.STRING)
    @Column(name = "email_status", nullable = false, columnDefinition = "varchar(20)")
    private EmailStatus emailStatus = EmailStatus.UNVERIFIED;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TwoFactorMethod> twoFactorMethods = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BackupCode> backupCodes = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "default_2fa_method", nullable = false, columnDefinition = "varchar(20)")
    private Default2faMethod default2faMethod = Default2faMethod.EMAIL;

    // Dodatkowe informacje użytkownika (edytowalne przez admina)
    @Column(length = 20)
    private String phone;

    @Column(length = 100)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private UserTeam team;

    // Audyt - data ostatniego logowania
    @Column(name = "last_login")
    private Timestamp lastLogin;

    // Przypisanie użytkownika do magazynów (many-to-many)
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "user_warehouse_assignments",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "warehouse_id")
    )
    private Set<Warehouse> assignedWarehouses = new HashSet<>();

    public void addTwoFactorMethod(TwoFactorMethod method) {
        twoFactorMethods.add(method);
        method.setUser(this);
    }

    public void removeTwoFactorMethod(TwoFactorMethod method) {
        twoFactorMethods.remove(method);
        method.setUser(null);
    }

    public void setEmailVerifications(EmailVerification emailVerification) {
        emailVerification.setUser(this);
        this.emailVerifications = emailVerification;
    }

    public void removeEmailVerifications() {
        if (emailVerifications != null) {
            emailVerifications.setUser(null);
            emailVerifications = null;
        }
    }

    public void addWebAuthnCredential(WebAuthnCredential credential) {
        webAuthnCredentials.add(credential);
        credential.setUser(this);
    }


    public void setRawPassword(String rawPassword) {
        this.password = BCrypt.hashpw(rawPassword, BCrypt.gensalt());
    }

    /**
     * Assigns user to a warehouse
     */
    public void assignToWarehouse(Warehouse warehouse) {
        assignedWarehouses.add(warehouse);
    }

    /**
     * Removes user assignment from a warehouse
     */
    public void removeFromWarehouse(Warehouse warehouse) {
        assignedWarehouses.remove(warehouse);
    }

    /**
     * Checks if user has access to a warehouse
     */
    public boolean hasAccessToWarehouse(Long warehouseId) {
        return assignedWarehouses.stream()
                .anyMatch(w -> w.getId().equals(warehouseId));
    }

}
