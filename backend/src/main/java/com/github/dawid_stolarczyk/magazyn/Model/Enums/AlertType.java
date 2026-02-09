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
    ITEM_TEMPERATURE_TOO_HIGH("Temperatura regału przekracza maksymalną tolerancję przedmiotu"),
    ITEM_TEMPERATURE_TOO_LOW("Temperatura regału poniżej minimalnej tolerancji przedmiotu"),
    UNAUTHORIZED_OUTBOUND("Nieautoryzowany outflow - waga regału niższa niż suma wag asortymentów"),
    EMBEDDING_GENERATION_COMPLETED("Zakończono generowanie embeddingów dla produktów"),
    EMBEDDING_GENERATION_FAILED("Błąd podczas generowania embeddingów dla produktów"),
    ASSORTMENT_EXPIRED("Assortment wygasł - produkt przekroczył datę ważności"),
    ASSORTMENT_CLOSE_TO_EXPIRY("Assortment bliski wygaśnięcia - zbliża się data ważności"),
    BACKUP_COMPLETED("Backup zakończony pomyślnie"),
    BACKUP_FAILED("Backup nie powiódł się"),
    ADMIN_MESSAGE("Wiadomość od administratora");

    private final String description;

    AlertType(String description) {
        this.description = description;
    }

}
