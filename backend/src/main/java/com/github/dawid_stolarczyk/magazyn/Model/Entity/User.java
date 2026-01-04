package com.github.dawid_stolarczyk.magazyn.Model.Entity;

import com.github.dawid_stolarczyk.magazyn.Model.Enums.AccountStatus;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.UserRole;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.security.crypto.bcrypt.BCrypt;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
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
    @Size(min=3, max=100)
    private String fullName;
    @Column(unique = true, nullable = false)
    @NotBlank
    @Size(min=3, max=50)
    private String username;
    @Column(nullable = false)
    @NotBlank
    private String password;
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, columnDefinition = "DEFAULT 'USER'")
    private UserRole role = UserRole.USER;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50, columnDefinition = "DEFAULT 'ACTIVE'")
    private AccountStatus status = AccountStatus.ACTIVE;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TwoFactorMethod> twoFactorMethods = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Warehouse> warehouses = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Assortment> assortments = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BackupCode> backupCodes = new ArrayList<>();

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

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    /**
     * Sets the password assuming the given value is already hashed.
     * Use {@link #setRawPassword(String)} when providing a plaintext password.
     */
    public void setPassword(String password) {
        this.password = password;
    }

    /**
     * Hashes the provided raw (plaintext) password and stores the hash.
     */
    public void setRawPassword(String rawPassword) {
        this.password = BCrypt.hashpw(rawPassword, BCrypt.gensalt());
    }
    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public List<Warehouse> getWarehouses() {
        return warehouses;
    }

    public void setWarehouses(List<Warehouse> warehouses) {
        this.warehouses = warehouses;
    }

    public List<Assortment> getAssortments() {
        return assortments;
    }

    public void setAssortments(List<Assortment> assortments) {
        this.assortments = assortments;
    }

    public AccountStatus getStatus() {
        return status;
    }

    public void setStatus(AccountStatus status) {
        this.status = status;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }


    public List<TwoFactorMethod> getTwoFactorMethods() {
        return twoFactorMethods;
    }

    public void setTwoFactorMethods(List<TwoFactorMethod> twoFactorMethods) {
        this.twoFactorMethods = twoFactorMethods;
    }

    public List<BackupCode> getBackupCodes() {
        return backupCodes;
    }

    public void setBackupCodes(List<BackupCode> backupCodes) {
        this.backupCodes = backupCodes;
    }
}
