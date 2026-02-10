package com.github.dawid_stolarczyk.magazyn.Exceptions;

public class BackupException extends RuntimeException {
    private final BackupError error;

    public BackupException(BackupError error) {
        super(error.getCode());
        this.error = error;
    }

    public BackupException(BackupError error, String message) {
        super(error.getCode() + ": " + message);
        this.error = error;
    }

    public BackupException(BackupError error, Throwable cause) {
        super(error.getCode(), cause);
        this.error = error;
    }

    public BackupException(BackupError error, String message, Throwable cause) {
        super(error.getCode() + ": " + message, cause);
        this.error = error;
    }

    public BackupError getError() {
        return error;
    }

    public String getCode() {
        return error.getCode();
    }
}
