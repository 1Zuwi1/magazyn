package com.github.dawid_stolarczyk.magazyn.Model.Enums;

import lombok.Getter;

@Getter
public enum BackupScheduleCode {
    DAILY("1 day"),
    WEEKLY("1 week"),
    MONTHLY("1 month");

    private final String description;

    BackupScheduleCode(String description) {
        this.description = description;
    }
}
