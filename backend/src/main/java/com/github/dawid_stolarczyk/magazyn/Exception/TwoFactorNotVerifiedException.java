package com.github.dawid_stolarczyk.magazyn.Exception;

import org.springframework.security.access.AccessDeniedException;

public class TwoFactorNotVerifiedException extends AccessDeniedException {
    public TwoFactorNotVerifiedException() {
        super("2FA not verified");
    }
}
