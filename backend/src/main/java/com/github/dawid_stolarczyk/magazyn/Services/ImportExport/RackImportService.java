package com.github.dawid_stolarczyk.magazyn.Services.ImportExport;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.RackDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.RackImportError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.RackImportReport;
import com.github.dawid_stolarczyk.magazyn.Services.RackService;
import com.github.dawid_stolarczyk.magazyn.Utils.CsvImportUtils;
import com.github.dawid_stolarczyk.magazyn.Utils.CsvImportUtils.CsvRow;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RackImportService {
    private static final int EXPECTED_COLUMNS =12;
    private static final String[] REQUIRED_COLUMNS = {
            "marker",
            "warehouse_id",
            "comment",
            "size_x",
            "size_y",
            "min_temp",
            "max_temp",
            "max_weight",
            "max_size_x",
            "max_size_y",
            "max_size_z",
            "accepts_dangerous"
    };

    private final RackService rackService;

    public RackImportReport importFromCsv(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("EMPTY_FILE");
        }

        List<RackImportError> errors = new ArrayList<>();
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
            return RackImportReport.builder()
                    .processedLines(0)
                    .imported(0)
                    .errors(errors)
                    .build();
        }

        for (String required : REQUIRED_COLUMNS) {
            if (!headerIndex.containsKey(required)) {
                errors.add(error(headerRow.lineNumber(), "MISSING_COLUMN " + required, headerRow.rawLine()));
                return RackImportReport.builder()
                        .processedLines(0)
                        .imported(0)
                        .errors(errors)
                        .build();
            }
        }

        if (headerIndex.size() != EXPECTED_COLUMNS) {
            errors.add(error(headerRow.lineNumber(),
                    "INVALID_COLUMN_COUNT expected=" + EXPECTED_COLUMNS + " actual=" + headerIndex.size(),
                    headerRow.rawLine()));
            return RackImportReport.builder()
                    .processedLines(0)
                    .imported(0)
                    .errors(errors)
                    .build();
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
                RackDto dto = mapToRackDto(columns, headerIndex);
                rackService.createRack(dto);
                imported++;
            } catch (IllegalArgumentException ex) {
                errors.add(error(row.lineNumber(), ex.getMessage(), row.rawLine()));
            }
        }

        return RackImportReport.builder()
                .processedLines(processedLines)
                .imported(imported)
                .errors(errors)
                .build();
    }

    private RackImportError error(int lineNumber, String message, String rawLine) {
        return RackImportError.builder()
                .lineNumber(lineNumber)
                .message(message)
                .rawLine(rawLine)
                .build();
    }

    private RackDto mapToRackDto(String[] columns, Map<String, Integer> headerIndex) {
        RackDto dto = new RackDto();
        dto.setMarker(emptyToNull(value(columns, headerIndex, "marker")));
        dto.setWarehouseId(parseLong(value(columns, headerIndex, "warehouse_id"), "INVALID_WAREHOUSE_ID"));
        dto.setComment(emptyToNull(value(columns, headerIndex, "comment")));
        dto.setSizeX(parseInt(value(columns, headerIndex, "size_x"), "INVALID_SIZE_X"));
        dto.setSizeY(parseInt(value(columns, headerIndex, "size_y"), "INVALID_SIZE_Y"));
        dto.setMinTemp(parseFloat(value(columns, headerIndex, "min_temp"), "INVALID_MIN_TEMP"));
        dto.setMaxTemp(parseFloat(value(columns, headerIndex, "max_temp"), "INVALID_MAX_TEMP"));
        dto.setMaxWeight(parseFloat(value(columns, headerIndex, "max_weight"), "INVALID_MAX_WEIGHT"));
        dto.setMaxSizeX(parseFloat(value(columns, headerIndex, "max_size_x"), "INVALID_MAX_SIZE_X"));
        dto.setMaxSizeY(parseFloat(value(columns, headerIndex, "max_size_y"), "INVALID_MAX_SIZE_Y"));
        dto.setMaxSizeZ(parseFloat(value(columns, headerIndex, "max_size_z"), "INVALID_MAX_SIZE_Z"));
        dto.setAcceptsDangerous(parseBoolean(value(columns, headerIndex, "accepts_dangerous"), "INVALID_ACCEPTS_DANGEROUS"));

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

    private String emptyToNull(String value) {
        String trimmed = value == null ? "" : value.trim();
        return trimmed.isEmpty() ? null : trimmed;
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

    private float parseFloat(String value, String errorCode) {
        try {
            return Float.parseFloat(value.trim());
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException(errorCode, ex);
        }
    }

    private boolean parseBoolean(String value, String errorCode) {
        String trimmed = value.trim().toLowerCase(Locale.ROOT);
        return switch (trimmed) {
            case "true", "1", "yes" -> true;
            case "false", "0", "no" -> false;
            default -> throw new IllegalArgumentException(errorCode);
        };
    }
}
