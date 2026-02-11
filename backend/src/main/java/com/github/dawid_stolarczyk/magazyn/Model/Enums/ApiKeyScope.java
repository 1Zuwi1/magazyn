package com.github.dawid_stolarczyk.magazyn.Model.Enums;

import lombok.Getter;

@Getter
public enum ApiKeyScope {
    SENSOR_WRITE("Wysyłanie danych telemetrycznych z sensorów"),
    REPORTS_GENERATE("Zlecanie generowania raportów"),
    INVENTORY_READ("Odczyt stanów magazynowych"),
    STRUCTURE_READ("Odczyt struktury magazynów i regałów");

    private final String description;

    ApiKeyScope(String description) {
        this.description = description;
    }
}
