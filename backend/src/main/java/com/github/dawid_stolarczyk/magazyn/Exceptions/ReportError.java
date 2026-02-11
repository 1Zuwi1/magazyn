package com.github.dawid_stolarczyk.magazyn.Exceptions;

public enum ReportError {
    WAREHOUSE_NOT_FOUND("WAREHOUSE_NOT_FOUND", "Warehouse not found"),
    REPORT_GENERATION_FAILED("REPORT_GENERATION_FAILED", "Report generation failed"),
    INVALID_DATE_RANGE("INVALID_DATE_RANGE", "Invalid date range");

    private final String code;
    private final String description;

    ReportError(String code, String description) {
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
