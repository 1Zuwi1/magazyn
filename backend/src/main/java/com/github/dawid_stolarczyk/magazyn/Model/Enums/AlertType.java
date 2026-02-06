package com.github.dawid_stolarczyk.magazyn.Model.Enums;

import lombok.Getter;

/**
 * Types of alerts that can be generated from rack reports
 */
@Getter
public enum AlertType {
    WEIGHT_EXCEEDED("Przekroczenie maksymalnej wagi"),
    TEMPERATURE_TOO_HIGH("Temperatura przekracza maksymalną dopuszczalną"),
    TEMPERATURE_TOO_LOW("Temperatura poniżej minimalnej dopuszczalnej"),
    LOW_VISUAL_SIMILARITY("Niski wynik podobieństwa wizualnego - produkt może być błędnie zidentyfikowany"),
    ITEM_TEMPERATURE_TOO_HIGH("Temperatura regału przekracza maksymalną tolerancję przedmiotu"),
    ITEM_TEMPERATURE_TOO_LOW("Temperatura regału poniżej minimalnej tolerancji przedmiotu");

    private final String description;

    AlertType(String description) {
        this.description = description;
    }

}
