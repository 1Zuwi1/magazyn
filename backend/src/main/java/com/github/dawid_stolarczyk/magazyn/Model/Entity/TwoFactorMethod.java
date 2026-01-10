package com.github.dawid_stolarczyk.magazyn.Model.Entity;

import com.github.dawid_stolarczyk.magazyn.Model.Enums.TwoFactor;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.sql.Timestamp;

@Entity
@Table(name = "two_factor_methods")
@Setter
@Getter
public class TwoFactorMethod {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private TwoFactor methodName;
    private String emailCode;
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

}
