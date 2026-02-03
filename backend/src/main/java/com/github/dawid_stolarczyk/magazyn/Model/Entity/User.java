package com.github.dawid_stolarczyk.magazyn.Model.Entity;

import com.github.dawid_stolarczyk.magazyn.Model.Enums.AccountStatus;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.Default2faMethod;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.UserRole;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.springframework.security.crypto.bcrypt.BCrypt;

import java.sql.Timestamp;
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
    @Column(name = "status", nullable = false)
    private AccountStatus status = AccountStatus.PENDING_VERIFICATION;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TwoFactorMethod> twoFactorMethods = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BackupCode> backupCodes = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "default_2fa_method", nullable = false)
    private Default2faMethod default2faMethod = Default2faMethod.EMAIL;

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

}
