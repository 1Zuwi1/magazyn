package com.github.dawid_stolarczyk.magazyn.Services.ImportExport;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ItemDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ItemImportError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ItemImportReport;
import com.github.dawid_stolarczyk.magazyn.Services.Inventory.ItemService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class ItemImportService extends AbstractImportService<ItemDto, ItemImportReport, ItemImportError> {
    // Format CSV (stała kolejność kolumn, BEZ nagłówka):
    // Nazwa;Id;Zdjecie;TempMin;TempMax;Waga;SzerokoscMm;WysokoscMm;GlebokoscMm;Komentarz;TerminWaznosciDni;CzyNiebezpieczny;
    private static final int COL_NAZWA = 0;
    private static final int COL_ID = 1;
    private static final int COL_ZDJECIE = 2;
    private static final int COL_TEMP_MIN = 3;
    private static final int COL_TEMP_MAX = 4;
    private static final int COL_WAGA = 5;
    private static final int COL_SZEROKOSC_MM = 6;
    private static final int COL_WYSOKOSC_MM = 7;
    private static final int COL_GLEBOKOSC_MM = 8;
    private static final int COL_KOMENTARZ = 9;
    private static final int COL_TERMIN_WAZNOSCI_DNI = 10;
    private static final int COL_CZY_NIEBEZPIECZNY = 11;
    private static final int MIN_COLUMNS = 12;

    private final ItemService itemService;

    public ItemImportService(ItemService itemService) {
        this.itemService = itemService;
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
    protected ItemDto mapToDto(String[] columns, Map<String, Integer> headerIndex) {
        if (columns.length != MIN_COLUMNS) {
            throw new IllegalArgumentException("INSUFFICIENT_COLUMNS: Expected at least " + MIN_COLUMNS + ", got " + columns.length);
        }

        ItemDto dto = new ItemDto();

        String idCode = getColumn(columns, COL_ID);
        if (!idCode.isEmpty()) {
            String code = "";

            // 1. Obsługa QR Code
            if (idCode.startsWith("QR-")) {
                log.info("Detected QR code format for ID: {}", idCode);
                code = idCode;
            }

            // 2. GS1-128 z prefiksem 01 (razem 16 znaków)
            else if (idCode.length() == 16 && idCode.startsWith("01")) {
                log.info("Detected GS1-128 format for ID: {}", idCode);
                code = idCode;
            }

            // 3. Czysty GTIN-14
            else if (idCode.matches("\\d{14}")) {
                log.info("Detected GTIN-14 format for ID: {}", idCode);
                code = "01" + idCode;
            }

            // 4. Obsługa EAN-13 (opcjonalnie)
            else if (idCode.matches("\\d{13}")) {
                log.info("Detected EAN-13 format for ID: {}", idCode);
                code = "010" + idCode;
            }

            if (!code.isBlank()) {
                log.info("Parsed code '{}' from raw ID '{}'", code, idCode);
                dto.setCode(code);
            }
        }

        // Nazwa produktu (WYMAGANE)
        dto.setName(getColumn(columns, COL_NAZWA));

        // Temperatury w °C (WYMAGANE)
        dto.setMinTemp(parseFloat(getColumn(columns, COL_TEMP_MIN), "INVALID_MIN_TEMP"));
        dto.setMaxTemp(parseFloat(getColumn(columns, COL_TEMP_MAX), "INVALID_MAX_TEMP"));

        // Waga w kg (WYMAGANE)
        dto.setWeight(parseFloat(getColumn(columns, COL_WAGA), "INVALID_WEIGHT"));

        // Wymiary w mm (WYMAGANE)
        dto.setSizeX(parseFloat(getColumn(columns, COL_SZEROKOSC_MM), "INVALID_SIZE_X"));
        dto.setSizeY(parseFloat(getColumn(columns, COL_WYSOKOSC_MM), "INVALID_SIZE_Y"));
        dto.setSizeZ(parseFloat(getColumn(columns, COL_GLEBOKOSC_MM), "INVALID_SIZE_Z"));

        // Termin ważności w dniach (OPCJONALNE)
        String expireRaw = getColumn(columns, COL_TERMIN_WAZNOSCI_DNI);
        if (!expireRaw.isEmpty()) {
            dto.setExpireAfterDays(parseLong(expireRaw, "INVALID_EXPIRE_DAYS"));
        }

        // Czy niebezpieczny TRUE/FALSE (OPCJONALNE, domyślnie FALSE)
        String dangerousRaw = getColumn(columns, COL_CZY_NIEBEZPIECZNY);
        if (!dangerousRaw.isEmpty()) {
            dto.setDangerous(parseBoolean(dangerousRaw));
        } else {
            dto.setDangerous(false);
        }

        // Komentarz (OPCJONALNE)
        String comment = emptyToNull(getColumn(columns, COL_KOMENTARZ));
        dto.setComment(comment);

        return dto;
    }

    @Override
    protected void processDto(ItemDto dto) {
        itemService.createItemInternal(dto);
    }

    @Override
    protected ItemImportError createError(int lineNumber, String message, String rawLine) {
        return ItemImportError.builder()
                .lineNumber(lineNumber)
                .message(message)
                .rawLine(rawLine)
                .build();
    }

    @Override
    protected ItemImportReport createReport(int processedLines, int imported, List<ItemImportError> errors) {
        return ItemImportReport.builder()
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
