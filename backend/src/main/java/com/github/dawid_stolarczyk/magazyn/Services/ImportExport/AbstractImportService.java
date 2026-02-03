package com.github.dawid_stolarczyk.magazyn.Services.ImportExport;

import com.github.dawid_stolarczyk.magazyn.Common.Enums.InventoryError;
import com.github.dawid_stolarczyk.magazyn.Utils.CsvImportUtils;
import com.github.dawid_stolarczyk.magazyn.Utils.CsvImportUtils.CsvRow;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
public abstract class AbstractImportService<T, R, E> {

    public R importFromCsv(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("EMPTY_FILE");
        }

        // Walidacja: tylko pliki CSV są akceptowane
        validateCsvFile(file);

        List<CsvRow> rows;
        try {
            rows = CsvImportUtils.readRows(file);
        } catch (IOException ex) {
            throw new IllegalArgumentException("CSV_READ_ERROR", ex);
        }

        if (rows.isEmpty()) {
            throw new IllegalArgumentException("EMPTY_FILE");
        }

        List<E> errors = new ArrayList<>();
        int processedLines = 0;
        int imported = 0;

        Map<String, Integer> headerIndex = null;
        int startRow = 0;

        // Sprawdź czy CSV ma nagłówek
        if (hasHeader()) {
            CsvRow headerRow = rows.get(0);
            try {
                headerIndex = CsvImportUtils.buildHeaderIndex(headerRow.columns());
            } catch (IllegalArgumentException ex) {
                errors.add(createError(headerRow.lineNumber(), ex.getMessage(), headerRow.rawLine()));
                return createReport(0, 0, errors);
            }

            for (String required : getRequiredColumns()) {
                if (!headerIndex.containsKey(required)) {
                    errors.add(createError(headerRow.lineNumber(), "MISSING_COLUMN " + required, headerRow.rawLine()));
                    return createReport(0, 0, errors);
                }
            }
            startRow = 1; // Pomiń nagłówek
        }

        // Przetwarzanie wierszy danych
        for (int i = startRow; i < rows.size(); i++) {
            CsvRow row = rows.get(i);
            processedLines++;

            try {
                T dto = mapToDto(row.columns(), headerIndex);
                processDto(dto);
                imported++;
            } catch (Exception ex) {
                errors.add(createError(row.lineNumber(), ex.getMessage(), row.rawLine()));
            }
        }

        return createReport(processedLines, imported, errors);
    }

    protected abstract String[] getRequiredColumns();

    /**
     * Czy CSV ma nagłówek w pierwszej linii?
     * Domyślnie true dla kompatybilności wstecznej.
     */
    protected boolean hasHeader() {
        return true;
    }

    protected abstract T mapToDto(String[] columns, Map<String, Integer> headerIndex);

    protected abstract void processDto(T dto);

    protected abstract E createError(int lineNumber, String message, String rawLine);

    protected abstract R createReport(int processedLines, int imported, List<E> errors);

    protected String value(String[] columns, Map<String, Integer> headerIndex, String key) {
        Integer idx = headerIndex.get(key);
        if (idx == null || idx < 0 || idx >= columns.length) {
            return "";
        }
        String raw = columns[idx].trim();
        return raw.equalsIgnoreCase("NULL") ? "" : raw;
    }

    protected long parseLong(String value, String errorCode) {
        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException(errorCode, ex);
        }
    }

    protected int parseInt(String value, String errorCode) {
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException(errorCode, ex);
        }
    }

    protected float parseFloat(String value, String errorCode) {
        try {
            return Float.parseFloat(value.trim());
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException(errorCode, ex);
        }
    }

    protected boolean parseBoolean(String value) {
        if (value == null) return false;
        String trimmed = value.trim().toLowerCase();
        return trimmed.equals("true") || trimmed.equals("1") || trimmed.equals("yes");
    }

    protected Timestamp parseTimestamp(String value, String errorCode) {
        if (value == null || value.isBlank() || value.equalsIgnoreCase("NULL")) {
            return null;
        }

        String trimmedValue = value.trim();

        try {
            // Najpierw próbuj parsować jako ISO 8601 z timezone (np. "2024-01-01T10:00:00Z")
            return Timestamp.from(Instant.parse(trimmedValue));
        } catch (DateTimeParseException ex) {
            try {
                // Jeśli to się nie uda, spróbuj jako lokalną datę (np. "2024-01-01")
                // UWAGA: Konwertuje na UTC midnight - może być niejednoznaczne dla różnych stref czasowych
                LocalDate date = LocalDate.parse(trimmedValue);
                return Timestamp.from(date.atStartOfDay().toInstant(ZoneOffset.UTC));
            } catch (DateTimeParseException nested) {
                throw new IllegalArgumentException(errorCode + ": Invalid date format '" + trimmedValue + "'. Expected ISO 8601 (yyyy-MM-dd'T'HH:mm:ss'Z') or date only (yyyy-MM-dd)", nested);
            }
        }
    }

    /**
     * Walidacja pliku CSV - sprawdza czy to rzeczywiście plik CSV
     */
    private void validateCsvFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException(InventoryError.FILE_IS_EMPTY.name());
        }

        // Sprawdź Content-Type
        String contentType = file.getContentType();
        if (contentType == null) {
            throw new IllegalArgumentException(InventoryError.MISSING_CONTENT_TYPE.name());
        }

        // Lista dozwolonych typów MIME dla CSV
        List<String> allowedTypes = List.of(
                "text/csv",
                "text/plain",
                "application/csv",
                "application/vnd.ms-excel", // Excel może wysyłać CSV z tym typem
                "text/comma-separated-values"
        );

        if (!allowedTypes.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException(InventoryError.INVALID_FILE_TYPE.name());
        }

        // Sprawdź rozszerzenie pliku
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new IllegalArgumentException(InventoryError.MISSING_FILENAME.name());
        }

        if (!originalFilename.contains(".")) {
            throw new IllegalArgumentException(InventoryError.MISSING_FILE_EXTENSION.name());
        }

        String extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
        List<String> allowedExtensions = List.of("csv", "txt");

        if (!allowedExtensions.contains(extension)) {
            throw new IllegalArgumentException(InventoryError.INVALID_FILE_EXTENSION.name());
        }

        // Sprawdź maksymalny rozmiar (np. 5MB dla CSV)
        long maxSize = 5 * 1024 * 1024; // 5MB
        if (file.getSize() > maxSize) {
            throw new IllegalArgumentException(InventoryError.FILE_TOO_LARGE.name());
        }

        // Sprawdź minimalny rozmiar (pusty plik)
        if (file.getSize() == 0) {
            throw new IllegalArgumentException(InventoryError.FILE_IS_EMPTY.name());
        }
    }
}
