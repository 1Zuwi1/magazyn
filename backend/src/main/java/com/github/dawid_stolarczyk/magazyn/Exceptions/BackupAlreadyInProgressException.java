package com.github.dawid_stolarczyk.magazyn.Exceptions;

public class BackupAlreadyInProgressException extends BackupException {
    public BackupAlreadyInProgressException() {
        super(BackupError.BACKUP_ALREADY_IN_PROGRESS);
    }

    public BackupAlreadyInProgressException(String message) {
        super(BackupError.BACKUP_ALREADY_IN_PROGRESS, message);
    }
}
