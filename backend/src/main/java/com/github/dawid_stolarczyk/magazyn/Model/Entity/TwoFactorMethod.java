package com.github.dawid_stolarczyk.magazyn.Model.Entity;

import com.github.dawid_stolarczyk.magazyn.Model.Enums.TwoFactor;
import jakarta.persistence.*;

import java.sql.Timestamp;

@Entity
@Table(name = "two_factor_methods")
public class TwoFactorMethod {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private TwoFactor methodName;
    @Column(nullable = true)
    private String emailCode;
    @Column(nullable = true)
    private String authenticatorSecret;
    private Timestamp codeGeneratedAt;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    public TwoFactorMethod() {
    }

    public TwoFactorMethod(TwoFactor methodName) {
        this.methodName = methodName;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public TwoFactor getMethodName() {
        return methodName;
    }

    public void setMethodName(TwoFactor methodName) {
        this.methodName = methodName;
    }

    public String getEmailCode() {
        return emailCode;
    }

    public void setEmailCode(String emailCode) {
        this.emailCode = emailCode;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Timestamp getCodeGeneratedAt() {
        return codeGeneratedAt;
    }

    public void setCodeGeneratedAt(Timestamp codeGeneratedAt) {
        this.codeGeneratedAt = codeGeneratedAt;
    }

    public String getAuthenticatorSecret() {
        return authenticatorSecret;
    }

    public void setAuthenticatorSecret(String authenticatorSecret) {
        this.authenticatorSecret = authenticatorSecret;
    }
}
