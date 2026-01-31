package com.github.dawid_stolarczyk.magazyn.Services.ImportExport;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ItemDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ItemImportError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ItemImportReport;
import com.github.dawid_stolarczyk.magazyn.Services.ItemService;
import com.github.dawid_stolarczyk.magazyn.Utils.CsvImportUtils;
import com.github.dawid_stolarczyk.magazyn.Utils.CsvImportUtils.CsvRow;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ItemImportService {
    private static final int EXPECTED_COLUMNS = 10;
    private static final String[] REQUIRED_COLUMNS = {
            "name",
            "min_temp",
            "max_temp",
            "weight",
            "size_x",
            "size_y",
            "size_z",
            "comment",
            "expire_after_days",
            "is_dangerous"
    };

    private final ItemService itemService;

    public ItemImportReport importFromCsv(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("EMPTY_FILE");
        }

        List<ItemImportError> errors = new ArrayList<>();
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
                ItemDto dto = mapToDto(columns, headerIndex);
                log.info("Importing item from line {}: {}", row.lineNumber(), dto);
                itemService.createItem(dto);
                imported++;
            } catch (IllegalArgumentException ex) {
                errors.add(error(row.lineNumber(), ex.getMessage(), row.rawLine()));
            }
        }

        return report(processedLines, imported, errors);
    }

    private ItemImportReport report(int processedLines, int imported, List<ItemImportError> errors) {
        return ItemImportReport.builder()
                .processedLines(processedLines)
                .imported(imported)
                .errors(errors)
                .build();
    }

    private ItemImportError error(int lineNumber, String message, String rawLine) {
        return ItemImportError.builder()
                .lineNumber(lineNumber)
                .message(message)
                .rawLine(rawLine)
                .build();
    }

    private ItemDto mapToDto(String[] columns, Map<String, Integer> headerIndex) {
        ItemDto dto = new ItemDto();
        dto.setName(value(columns, headerIndex, "name"));
        dto.setMinTemp(parseFloat(value(columns, headerIndex, "min_temp"), "INVALID_MIN_TEMP"));
        dto.setMaxTemp(parseFloat(value(columns, headerIndex, "max_temp"), "INVALID_MAX_TEMP"));
        dto.setWeight(parseFloat(value(columns, headerIndex, "weight"), "INVALID_WEIGHT"));
        dto.setSizeX(parseFloat(value(columns, headerIndex, "size_x"), "INVALID_SIZE_X"));
        dto.setSizeY(parseFloat(value(columns, headerIndex, "size_y"), "INVALID_SIZE_Y"));
        dto.setSizeZ(parseFloat(value(columns, headerIndex, "size_z"), "INVALID_SIZE_Z"));
        dto.setComment(value(columns, headerIndex, "comment"));
        dto.setExpireAfterDays(parseLong(value(columns, headerIndex, "expire_after_days"), "INVALID_EXPIRE_AFTER_DAYS"));
        dto.setDangerous(parseBoolean(value(columns, headerIndex, "is_dangerous"), "INVALID_IS_DANGEROUS"));

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
