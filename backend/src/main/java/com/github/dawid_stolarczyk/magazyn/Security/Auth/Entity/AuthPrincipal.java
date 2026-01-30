package com.github.dawid_stolarczyk.magazyn.Security.Auth.Entity;

import com.github.dawid_stolarczyk.magazyn.Model.Enums.Status2FA;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class AuthPrincipal {
    private final Long userId;
    private final Status2FA status2FA;
    private final boolean sudoMode;
}
