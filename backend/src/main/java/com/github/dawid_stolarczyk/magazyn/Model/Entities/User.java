package com.github.dawid_stolarczyk.magazyn.Model.Entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.security.crypto.bcrypt.BCrypt;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "public_id", unique = true, nullable = false, updatable = false)
    private String publicId;
    @Column(unique = true, nullable = false)
    @NotBlank
    @Size(min=3, max=50)
    private String username;
    @Column(nullable = false)
    @NotBlank
    private String password;
    @NotNull
    @Enumerated(EnumType.STRING)
    private UserRole role;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Warehouse> warehouses = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Assortment> assortments = new ArrayList<>();

    @PrePersist
    public void generatePublicId() {
        if (publicId == null) {
            publicId = UUID.randomUUID().toString();
        }
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

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPublicId() {
        return publicId;
    }

    public void setPublicId(String publicId) {
        this.publicId = publicId;
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
}
