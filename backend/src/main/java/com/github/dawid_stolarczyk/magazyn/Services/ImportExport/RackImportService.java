package com.github.dawid_stolarczyk.magazyn.Services.ImportExport;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.RackDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.RackImportError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.RackImportReport;
import com.github.dawid_stolarczyk.magazyn.Services.Inventory.RackService;
import com.github.dawid_stolarczyk.magazyn.Utils.StringUtils;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class RackImportService extends AbstractImportService<RackDto, RackImportReport, RackImportError> {
    // Format CSV (stała kolejność kolumn, BEZ nagłówka):
    // WarehouseId;Marker;M;N;TempMin;TempMax;MaxWagaKg;MaxSzerokoscMm;MaxWysokoscMm;MaxGlebokoscMm;AcceptsDangerous;Komentarz
    private static final int COL_WAREHOUSE_ID = 0;
    private static final int COL_MARKER = 1;
    private static final int COL_M = 2;
    private static final int COL_N = 3;
    private static final int COL_TEMP_MIN = 4;
    private static final int COL_TEMP_MAX = 5;
    private static final int COL_MAX_WAGA_KG = 6;
    private static final int COL_MAX_SZEROKOSC_MM = 7;
    private static final int COL_MAX_WYSOKOSC_MM = 8;
    private static final int COL_MAX_GLEBOKOSC_MM = 9;
    private static final int COL_ACCEPTS_DANGEROUS = 10;
    private static final int COL_KOMENTARZ = 11;
    private static final int MIN_COLUMNS = 10; // AcceptsDangerous i Komentarz są opcjonalne

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

        // WarehouseId - ID magazynu
        dto.setWarehouseId(parseLong(getColumn(columns, COL_WAREHOUSE_ID), "INVALID_WAREHOUSE_ID"));

        // Marker - oznaczenie regału (normalizowane automatycznie)
        dto.setMarker(StringUtils.normalizeRackMarker(getColumn(columns, COL_MARKER)));

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
