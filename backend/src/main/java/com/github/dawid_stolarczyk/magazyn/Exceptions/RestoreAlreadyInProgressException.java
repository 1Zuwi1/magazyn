package com.github.dawid_stolarczyk.magazyn.Exceptions;

public class RestoreAlreadyInProgressException extends BackupException {
    public RestoreAlreadyInProgressException() {
        super(BackupError.RESTORE_ALREADY_IN_PROGRESS);
    }

    public RestoreAlreadyInProgressException(String message) {
        super(BackupError.RESTORE_ALREADY_IN_PROGRESS, message);
    }
}
