package com.github.dawid_stolarczyk.magazyn.Services.Inventory;

import com.github.dawid_stolarczyk.magazyn.Common.Enums.InventoryError;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Item;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.AssortmentRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.ItemRepository;
import com.github.dawid_stolarczyk.magazyn.Utils.CodeGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class BarcodeService {
    private static final DateTimeFormatter GS1_DATE_FORMAT = DateTimeFormatter.ofPattern("yyMMdd");
    private static final int SERIAL_LENGTH = 6;
    private static final int ITEM_CODE_LENGTH = 14;
    private static final int GTIN_14_LENGTH = 14;
    private static final int MAX_RETRY_ATTEMPTS = 100; // Maksymalna liczba prób generowania unikalnego kodu
    private final ItemRepository itemRepository;
    private final AssortmentRepository assortmentRepository;

    public String generateUniqueItemCode() {
        String code;
        int attempts = 0;
        do {
            if (attempts >= MAX_RETRY_ATTEMPTS) {
                throw new IllegalStateException(InventoryError.BARCODE_GENERATION_FAILED.name() + ": Unable to generate unique barcode after " + MAX_RETRY_ATTEMPTS + " attempts");
            }
            code = CodeGenerator.generateWithNumbers(ITEM_CODE_LENGTH-1);
            int checksum = CodeGenerator.calculateGTIN14Checksum(code);
            code += checksum;
            attempts++;
        } while (itemRepository.existsByCode(code));
        return code;
    }

    public boolean checkUniqueItemCode(String code) {
        return !itemRepository.existsByCode(code);
    }

    public void ensureItemCode(Item item) {
        if (item.getCode() != null && !item.getCode().isBlank() && item.getCode().length() == ITEM_CODE_LENGTH) {
            return;
        }
        item.setCode(generateUniqueItemCode());
        itemRepository.save(item);
    }

    /**
     * Builds a GS1-128 compliant barcode for an assortment.
     * Uses:
     * (11) Production Date - YYMMDD
     * (01) GTIN-14 - item code padded to 14 digits
     * (21) Serial Number - random digits (variable length, last AI)
     *
     * @param itemCode the 14-digit item code (GS1-128 barcode)
     * @return GS1-128 formatted barcode string (digits only)
     */
    public String buildPlacementCode(String itemCode) {
        if (itemCode == null || !itemCode.matches("\\d{" + ITEM_CODE_LENGTH + "}")) {
            throw new IllegalArgumentException(InventoryError.BARCODE_MUST_BE_14_DIGITS.name());
        }

        String datePart = LocalDate.now(ZoneOffset.UTC).format(GS1_DATE_FORMAT);

        // AI 11: Production Date (YYMMDD, 6 digits).
        String ai11 = "11" + datePart;

        // AI 01: GTIN-14 padded with leading zeros.
        String gtin14 = String.format("%0" + GTIN_14_LENGTH + "d", Long.parseLong(itemCode));
        String ai01 = "01" + gtin14;

        String code;
        int attempts = 0;
        do {
            if (attempts >= MAX_RETRY_ATTEMPTS) {
                throw new IllegalStateException(InventoryError.PLACEMENT_BARCODE_GENERATION_FAILED.name() + ": Unable to generate unique barcode after " + MAX_RETRY_ATTEMPTS + " attempts");
            }
            // AI 21: Serial Number (variable length, last AI so no FNC1 separator needed).
            String ai21 = "21" + CodeGenerator.generateWithNumbers(SERIAL_LENGTH);
            code = ai11 + ai01 + ai21;
            attempts++;
        } while (assortmentRepository.existsByCode(code));

        return code;
    }
}
