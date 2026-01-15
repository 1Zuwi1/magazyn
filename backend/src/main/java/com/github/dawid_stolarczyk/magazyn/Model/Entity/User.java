package com.github.dawid_stolarczyk.magazyn.Model.Entity;

import com.github.dawid_stolarczyk.magazyn.Model.Enums.AccountStatus;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.TwoFactor;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.UserRole;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NonNull;
import lombok.Setter;
import org.springframework.security.crypto.bcrypt.BCrypt;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Getter
@Setter
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
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
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private UserRole role = UserRole.USER;
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private EmailVerification emailVerifications;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private AccountStatus status = AccountStatus.PENDING_VERIFICATION;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TwoFactorMethod> twoFactorMethods = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Warehouse> warehouses = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Assortment> assortments = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BackupCode> backupCodes = new ArrayList<>();

    public User() {
        addTwoFactorMethod(new TwoFactorMethod(TwoFactor.EMAIL));
    }

    public void addWarehouse(Warehouse warehouse) {
        warehouses.add(warehouse);
        warehouse.setUser(this);
    }

    public void removeWarehouse(Warehouse warehouse) {
        warehouses.remove(warehouse);
        warehouse.setUser(null);
    }

    public void addAssortment(Assortment assortment) {
        assortments.add(assortment);
        assortment.setUser(this);
    }

    public void removeAssortment(Assortment assortment) {
        assortments.remove(assortment);
        assortment.setUser(null);
    }

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


    public void setRawPassword(String rawPassword) {
        this.password = BCrypt.hashpw(rawPassword, BCrypt.gensalt());
    }

    public @NonNull byte[] getIdAsBytes() {
        return Long.toString(id).getBytes();
    }
}
