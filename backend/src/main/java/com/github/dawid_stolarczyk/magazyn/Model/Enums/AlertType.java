package com.github.dawid_stolarczyk.magazyn.Model.Enums;

/**
 * Types of alerts that can be generated from rack reports
 */
public enum AlertType {
    WEIGHT_EXCEEDED("Przekroczenie maksymalnej wagi"),
    TEMPERATURE_TOO_HIGH("Temperatura przekracza maksymalną dopuszczalną"),
    TEMPERATURE_TOO_LOW("Temperatura poniżej minimalnej dopuszczalnej"),
    DANGEROUS_ITEM_NOT_ALLOWED("Niebezpieczny przedmiot w niedozwolonym regale"),
    ITEM_TOO_LARGE("Przedmiot przekracza dopuszczalne wymiary");

    private final String description;

    AlertType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
