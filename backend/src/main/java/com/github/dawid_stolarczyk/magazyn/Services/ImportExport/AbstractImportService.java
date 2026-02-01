package com.github.dawid_stolarczyk.magazyn.Services.ImportExport;

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

        CsvRow headerRow = rows.get(0);
        Map<String, Integer> headerIndex;
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

        for (int i = 1; i < rows.size(); i++) {
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
        try {
            return Timestamp.from(Instant.parse(value));
        } catch (DateTimeParseException ex) {
            try {
                LocalDate date = LocalDate.parse(value);
                return Timestamp.from(date.atStartOfDay().toInstant(ZoneOffset.UTC));
            } catch (DateTimeParseException nested) {
                throw new IllegalArgumentException(errorCode, nested);
            }
        }
    }
}
