package com.github.dawid_stolarczyk.magazyn.Model.Enums;

public enum UserTeam {
    OPERATIONS("Operacje magazynowe"),
    LOGISTICS("Logistyka"),
    WAREHOUSE("Zarządzanie magazynem"),
    INVENTORY("Inwentaryzacja"),
    QUALITY_CONTROL("Kontrola jakości"),
    RECEIVING("Przyjęcie towarów"),
    SHIPPING("Wysyłka"),
    IT_SUPPORT("Wsparcie IT"),
    MANAGEMENT("Zarząd");

    private final String displayName;

    UserTeam(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
