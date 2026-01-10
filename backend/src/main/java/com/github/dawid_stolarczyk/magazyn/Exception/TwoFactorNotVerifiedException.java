package com.github.dawid_stolarczyk.magazyn.Exception;

public class TwoFactorNotVerifiedException extends RuntimeException {
    public TwoFactorNotVerifiedException() {
        super("2FA not verified");
    }
}
