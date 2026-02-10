package com.github.dawid_stolarczyk.magazyn.Exceptions;

public class RestoreAlreadyInProgressException extends RuntimeException {
    public RestoreAlreadyInProgressException() {
        super("RESTORE_ALREADY_IN_PROGRESS");
    }

    public RestoreAlreadyInProgressException(String message) {
        super(message);
    }
}
