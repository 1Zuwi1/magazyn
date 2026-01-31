package com.github.dawid_stolarczyk.magazyn.Services;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.WarehouseDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.WarehouseImportError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.WarehouseImportReport;
import com.github.dawid_stolarczyk.magazyn.Utils.CsvImportUtils;
import com.github.dawid_stolarczyk.magazyn.Utils.CsvImportUtils.CsvRow;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WarehouseImportService {
    private static final int EXPECTED_COLUMNS = 1;
    private static final String[] REQUIRED_COLUMNS = {
            "name"
    };

    private final WarehouseService warehouseService;

    public WarehouseImportReport importFromCsv(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("EMPTY_FILE");
        }

        List<WarehouseImportError> errors = new ArrayList<>();
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
                WarehouseDto dto = mapToDto(columns, headerIndex);
                warehouseService.createWarehouse(dto);
                imported++;
            } catch (Exception ex) {
                errors.add(error(row.lineNumber(), ex.getMessage(), row.rawLine()));
            }
        }

        return report(processedLines, imported, errors);
    }

    private WarehouseImportReport report(int processedLines, int imported, List<WarehouseImportError> errors) {
        return WarehouseImportReport.builder()
                .processedLines(processedLines)
                .imported(imported)
                .errors(errors)
                .build();
    }

    private WarehouseImportError error(int lineNumber, String message, String rawLine) {
        return WarehouseImportError.builder()
                .lineNumber(lineNumber)
                .message(message)
                .rawLine(rawLine)
                .build();
    }

    private WarehouseDto mapToDto(String[] columns, Map<String, Integer> headerIndex) {
        WarehouseDto dto = new WarehouseDto();
        dto.setName(value(columns, headerIndex, "name"));
        if (dto.getName() == null || dto.getName().isBlank()) {
            throw new IllegalArgumentException("INVALID_NAME");
        }
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
}
