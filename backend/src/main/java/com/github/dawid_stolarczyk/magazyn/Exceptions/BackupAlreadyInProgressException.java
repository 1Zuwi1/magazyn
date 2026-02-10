package com.github.dawid_stolarczyk.magazyn.Exceptions;

public class BackupAlreadyInProgressException extends RuntimeException {
    public BackupAlreadyInProgressException() {
        super("BACKUP_ALREADY_IN_PROGRESS");
    }

    public BackupAlreadyInProgressException(String message) {
        super(message);
    }
}
