package com.github.dawid_stolarczyk.magazyn.Services.ImportExport;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.AssortmentDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.AssortmentImportError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.AssortmentImportReport;
import com.github.dawid_stolarczyk.magazyn.Services.AssortmentService;
import com.github.dawid_stolarczyk.magazyn.Utils.CsvImportUtils;
import com.github.dawid_stolarczyk.magazyn.Utils.CsvImportUtils.CsvRow;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
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

@Service
@RequiredArgsConstructor
public class AssortmentImportService {
    private static final int EXPECTED_COLUMNS = 5;
    private static final String[] REQUIRED_COLUMNS = {
            "item_id",
            "rack_id",
            "position_x",
            "position_y",
            "expires_at"
    };

    private final AssortmentService assortmentService;

    public AssortmentImportReport importFromCsv(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("EMPTY_FILE");
        }

        List<AssortmentImportError> errors = new ArrayList<>();
        int processedLines = 0;
        int imported = 0;

        List<CsvRow> rows;
        try {
            rows = CsvImportUtils.readRows(file);
        } catch (IOException ex) {
            throw new IllegalArgumentException("CSV_READ_ERROR", ex);
        }

        if (rows.isEmpty()) {
            throw new IllegalArgumentException("EMPTY_FILE");
        }

        CsvRow headerRow = rows.get(0);
        Map<String, Integer> headerIndex;
        try {
            headerIndex = CsvImportUtils.buildHeaderIndex(headerRow.columns());
        } catch (IllegalArgumentException ex) {
            errors.add(error(headerRow.lineNumber(), ex.getMessage(), headerRow.rawLine()));
            return report(0, 0, errors);
        }

        for (String required : REQUIRED_COLUMNS) {
            if (!headerIndex.containsKey(required)) {
                errors.add(error(headerRow.lineNumber(), "MISSING_COLUMN " + required, headerRow.rawLine()));
                return report(0, 0, errors);
            }
        }

        if (headerIndex.size() != EXPECTED_COLUMNS) {
            errors.add(error(headerRow.lineNumber(),
                    "INVALID_COLUMN_COUNT expected=" + EXPECTED_COLUMNS + " actual=" + headerIndex.size(),
                    headerRow.rawLine()));
            return report(0, 0, errors);
        }

        for (int i = 1; i < rows.size(); i++) {
            CsvRow row = rows.get(i);
            processedLines++;

            String[] columns = row.columns();
            if (columns.length != headerIndex.size()) {
                errors.add(error(row.lineNumber(),
                        "INVALID_COLUMN_COUNT expected=" + headerIndex.size() + " actual=" + columns.length,
                        row.rawLine()));
                continue;
            }

            try {
                AssortmentDto dto = mapToDto(columns, headerIndex);
                assortmentService.createAssortment(dto);
                imported++;
            } catch (IllegalArgumentException ex) {
                errors.add(error(row.lineNumber(), ex.getMessage(), row.rawLine()));
            }
        }

        return report(processedLines, imported, errors);
    }

    private AssortmentImportReport report(int processedLines, int imported, List<AssortmentImportError> errors) {
        return AssortmentImportReport.builder()
                .processedLines(processedLines)
                .imported(imported)
                .errors(errors)
                .build();
    }

    private AssortmentImportError error(int lineNumber, String message, String rawLine) {
        return AssortmentImportError.builder()
                .lineNumber(lineNumber)
                .message(message)
                .rawLine(rawLine)
                .build();
    }

    private AssortmentDto mapToDto(String[] columns, Map<String, Integer> headerIndex) {
        AssortmentDto dto = new AssortmentDto();
        dto.setItemId(parseLong(value(columns, headerIndex, "item_id"), "INVALID_ITEM_ID"));
        dto.setRackId(parseLong(value(columns, headerIndex, "rack_id"), "INVALID_RACK_ID"));
        dto.setPositionX(parseInt(value(columns, headerIndex, "position_x"), "INVALID_POSITION_X"));
        dto.setPositionY(parseInt(value(columns, headerIndex, "position_y"), "INVALID_POSITION_Y"));
        dto.setExpiresAt(parseTimestamp(value(columns, headerIndex, "expires_at"), "INVALID_EXPIRES_AT"));

        return dto;
    }

    private String value(String[] columns, Map<String, Integer> headerIndex, String key) {
        Integer idx = headerIndex.get(key);
        if (idx == null || idx < 0 || idx >= columns.length) {
            return "";
        }
        String raw = columns[idx].trim();
        return raw.equalsIgnoreCase("NULL") ? "" : raw;
    }

    private long parseLong(String value, String errorCode) {
        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException(errorCode, ex);
        }
    }

    private int parseInt(String value, String errorCode) {
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException(errorCode, ex);
        }
    }

    private Timestamp parseTimestamp(String value, String errorCode) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Timestamp.from(Instant.parse(value));
        } catch (DateTimeParseException ex) {
            try {
                LocalDate date = LocalDate.parse(value);
                return Timestamp.from(date.atStartOfDay().toInstant(ZoneOffset.UTC));
            } catch (DateTimeParseException nested) {
                throw new IllegalArgumentException(errorCode, ex);
            }
        }
    }
}
