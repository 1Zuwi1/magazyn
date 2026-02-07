package com.github.dawid_stolarczyk.magazyn.Model.Enums;

/**
 * Status of an alert in the system
 */
public enum AlertStatus {
    /**
     * Alert has just been created and is awaiting action
     */
    OPEN,

    /**
     * Alert is being actively investigated/processed
     */
    ACTIVE,

    /**
     * Alert has been resolved and closed
     */
    RESOLVED,

    /**
     * Alert has been dismissed (e.g., false positive)
     */
    DISMISSED
}
