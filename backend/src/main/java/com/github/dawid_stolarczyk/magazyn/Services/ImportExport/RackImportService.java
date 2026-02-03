package com.github.dawid_stolarczyk.magazyn.Services.ImportExport;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.RackDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.RackImportError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.RackImportReport;
import com.github.dawid_stolarczyk.magazyn.Services.Inventory.RackService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class RackImportService extends AbstractImportService<RackDto, RackImportReport, RackImportError> {
    // Format CSV (stała kolejność kolumn, BEZ nagłówka):
    // Oznaczenie;M;N;TempMin;TempMax;MaxWagaKg;MaxSzerokoscMm;MaxWysokoscMm;MaxGlebokoscMm;AcceptsDangerous;Komentarz
    private static final int COL_OZNACZENIE = 0;
    private static final int COL_M = 1;
    private static final int COL_N = 2;
    private static final int COL_TEMP_MIN = 3;
    private static final int COL_TEMP_MAX = 4;
    private static final int COL_MAX_WAGA_KG = 5;
    private static final int COL_MAX_SZEROKOSC_MM = 6;
    private static final int COL_MAX_WYSOKOSC_MM = 7;
    private static final int COL_MAX_GLEBOKOSC_MM = 8;
    private static final int COL_ACCEPTS_DANGEROUS = 9;
    private static final int COL_KOMENTARZ = 10;
    private static final int MIN_COLUMNS = 9; // AcceptsDangerous i Komentarz są opcjonalne

    private final RackService rackService;

    public RackImportService(RackService rackService) {
        this.rackService = rackService;
    }

    @Override
    protected String[] getRequiredColumns() {
        return new String[0]; // Nie używamy nagłówków
    }

    @Override
    protected boolean hasHeader() {
        return false; // CSV bez nagłówka
    }

    @Override
    protected RackDto mapToDto(String[] columns, Map<String, Integer> headerIndex) {
        // headerIndex jest null, używamy stałych indeksów
        if (columns.length < MIN_COLUMNS) {
            throw new IllegalArgumentException("INSUFFICIENT_COLUMNS: Expected at least " + MIN_COLUMNS + ", got " + columns.length);
        }

        RackDto dto = new RackDto();

        // Oznaczenie - marker regału (może zawierać prefix warehouse: W{id}-{marker})
        String oznaczenie = getColumn(columns, COL_OZNACZENIE);

        // Parsowanie warehouse ID i markera z Oznaczenia
        Long warehouseId = null;
        String marker = oznaczenie;

        if (oznaczenie.matches("^W\\d+-.*")) {
            int dashIndex = oznaczenie.indexOf('-');
            String warehousePrefix = oznaczenie.substring(1, dashIndex);
            warehouseId = parseLong(warehousePrefix, "INVALID_WAREHOUSE_PREFIX");
            marker = oznaczenie.substring(dashIndex + 1);
        }

        dto.setMarker(marker);

        if (warehouseId != null) {
            dto.setWarehouseId(warehouseId);
        } else {
            throw new IllegalArgumentException("MISSING_WAREHOUSE_ID: Use prefix 'W{id}-' in Oznaczenie (e.g., W1-R-01)");
        }

        // M i N - rozmiary regału
        dto.setSizeX(parseInt(getColumn(columns, COL_M), "INVALID_SIZE_M"));
        dto.setSizeY(parseInt(getColumn(columns, COL_N), "INVALID_SIZE_N"));

        // Temperatury
        dto.setMinTemp(parseFloat(getColumn(columns, COL_TEMP_MIN), "INVALID_MIN_TEMP"));
        dto.setMaxTemp(parseFloat(getColumn(columns, COL_TEMP_MAX), "INVALID_MAX_TEMP"));

        // Maksymalna waga (kg)
        dto.setMaxWeight(parseFloat(getColumn(columns, COL_MAX_WAGA_KG), "INVALID_MAX_WEIGHT"));

        // Maksymalne wymiary przedmiotów (mm)
        dto.setMaxSizeX(parseFloat(getColumn(columns, COL_MAX_SZEROKOSC_MM), "INVALID_MAX_SIZE_X"));
        dto.setMaxSizeY(parseFloat(getColumn(columns, COL_MAX_WYSOKOSC_MM), "INVALID_MAX_SIZE_Y"));
        dto.setMaxSizeZ(parseFloat(getColumn(columns, COL_MAX_GLEBOKOSC_MM), "INVALID_MAX_SIZE_Z"));

        // Czy akceptuje niebezpieczne produkty TRUE/FALSE (OPCJONALNE, domyślnie FALSE)
        if (columns.length > COL_ACCEPTS_DANGEROUS) {
            String dangerousRaw = getColumn(columns, COL_ACCEPTS_DANGEROUS);
            if (!dangerousRaw.isEmpty()) {
                dto.setAcceptsDangerous(parseBoolean(dangerousRaw));
            } else {
                dto.setAcceptsDangerous(false);
            }
        } else {
            dto.setAcceptsDangerous(false);
        }

        // Komentarz (OPCJONALNE)
        if (columns.length > COL_KOMENTARZ) {
            dto.setComment(emptyToNull(getColumn(columns, COL_KOMENTARZ)));
        }


        return dto;
    }

    @Override
    protected void processDto(RackDto dto) {
        rackService.createRackInternal(dto);
    }

    @Override
    protected RackImportError createError(int lineNumber, String message, String rawLine) {
        return RackImportError.builder()
                .lineNumber(lineNumber)
                .message(message)
                .rawLine(rawLine)
                .build();
    }

    @Override
    protected RackImportReport createReport(int processedLines, int imported, List<RackImportError> errors) {
        return RackImportReport.builder()
                .processedLines(processedLines)
                .imported(imported)
                .errors(errors)
                .build();
    }

    private String getColumn(String[] columns, int index) {
        if (index < 0 || index >= columns.length) {
            return "";
        }
        String value = columns[index].trim();
        return value.equalsIgnoreCase("NULL") ? "" : value;
    }

    private String emptyToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
