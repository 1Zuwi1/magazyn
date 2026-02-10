package com.github.dawid_stolarczyk.magazyn.Exceptions;

public enum BackupError {
    WAREHOUSE_NOT_FOUND("WAREHOUSE_NOT_FOUND", "Warehouse not found"),
    BACKUP_NOT_FOUND("BACKUP_NOT_FOUND", "Backup record not found"),
    BACKUP_ALREADY_IN_PROGRESS("BACKUP_ALREADY_IN_PROGRESS", "Backup operation already in progress for this warehouse"),
    RESTORE_ALREADY_IN_PROGRESS("RESTORE_ALREADY_IN_PROGRESS", "Restore operation already in progress for this warehouse"),
    RESTORE_LOCK_ACQUISITION_FAILED("RESTORE_LOCK_ACQUISITION_FAILED", "Failed to acquire restore lock"),
    BACKUP_NOT_COMPLETED("BACKUP_NOT_COMPLETED", "Cannot restore - backup is not completed"),
    WAREHOUSE_ACCESS_DENIED("WAREHOUSE_ACCESS_DENIED", "Access denied to this warehouse"),
    BACKUP_FAILED("BACKUP_FAILED", "Backup operation failed"),
    RESTORE_FAILED("RESTORE_FAILED", "Restore operation failed"),
    BACKUP_TIMEOUT("BACKUP_TIMEOUT", "Backup operation timed out"),
    STORAGE_ERROR("STORAGE_ERROR", "Storage service error"),
    ENCRYPTION_ERROR("ENCRYPTION_ERROR", "Data encryption/decryption error"),
    BACKUP_CORRUPTED("BACKUP_CORRUPTED", "Backup data is corrupted or invalid"),
    RACK_MAPPING_NOT_FOUND("RACK_MAPPING_NOT_FOUND", "Rack ID mapping not found during restore"),
    ITEM_MAPPING_NOT_FOUND("ITEM_MAPPING_NOT_FOUND", "Item ID mapping not found during restore"),
    NO_WAREHOUSES_FOUND("NO_WAREHOUSES_FOUND", "No warehouses found"),
    NO_COMPLETED_BACKUP("NO_COMPLETED_BACKUP", "No completed backup found for this warehouse"),
    SCHEDULE_NOT_FOUND("SCHEDULE_NOT_FOUND", "Backup schedule not found"),
    BACKUP_LOCK_ACQUISITION_FAILED("BACKUP_LOCK_ACQUISITION_FAILED", "Failed to acquire backup lock"),
    R2_CLEANUP_FAILED("R2_CLEANUP_FAILED", "Failed to cleanup R2 storage");

    private final String code;
    private final String description;

    BackupError(String code, String description) {
        this.code = code;
        this.description = description;
    }

    public String getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }
}
