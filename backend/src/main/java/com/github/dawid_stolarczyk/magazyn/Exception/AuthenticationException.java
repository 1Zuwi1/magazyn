package com.github.dawid_stolarczyk.magazyn.Exception;

import lombok.Getter;

@Getter
public class AuthenticationException extends RuntimeException {
    private String code;

    public AuthenticationException() {
        super();
    }

    public AuthenticationException(String code) {
        super(code);
        this.code = code;
    }

    public AuthenticationException(String code, String message) {
        super(message);
        this.code = code;
    }

    public AuthenticationException(String message, Throwable cause) {
        super(message, cause);
    }

}
