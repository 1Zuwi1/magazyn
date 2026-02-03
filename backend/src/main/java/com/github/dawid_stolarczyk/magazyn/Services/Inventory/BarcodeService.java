package com.github.dawid_stolarczyk.magazyn.Services.Inventory;

import com.github.dawid_stolarczyk.magazyn.Common.Enums.InventoryError;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Item;
import com.github.dawid_stolarczyk.magazyn.Repositories.AssortmentRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.ItemRepository;
import com.github.dawid_stolarczyk.magazyn.Utils.CodeGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class BarcodeService {
    private static final DateTimeFormatter GS1_DATE_FORMAT = DateTimeFormatter.ofPattern("yyMMdd");
    private static final int SERIAL_LENGTH = 6;
    private static final int ITEM_BARCODE_LENGTH = 14;
    private static final int GTIN_14_LENGTH = 14;
    private static final int MAX_RETRY_ATTEMPTS = 100; // Maksymalna liczba prób generowania unikalnego kodu
    private final ItemRepository itemRepository;
    private final AssortmentRepository assortmentRepository;

    public String generateUniqueItemBarcode() {
        String barcode;
        int attempts = 0;
        do {
            if (attempts >= MAX_RETRY_ATTEMPTS) {
                throw new IllegalStateException(InventoryError.BARCODE_GENERATION_FAILED.name() + ": Unable to generate unique barcode after " + MAX_RETRY_ATTEMPTS + " attempts");
            }
            barcode = CodeGenerator.generateWithNumbers(ITEM_BARCODE_LENGTH);
            attempts++;
        } while (itemRepository.existsByBarcode(barcode));
        return barcode;
    }

    public void ensureItemBarcode(Item item) {
        if (item.getBarcode() != null && !item.getBarcode().isBlank() && item.getBarcode().length() == ITEM_BARCODE_LENGTH) {
            return;
        }
        item.setBarcode(generateUniqueItemBarcode());
        itemRepository.save(item);
    }

    /**
     * Builds a GS1-128 compliant barcode for an assortment.
     * Uses:
     * (11) Production Date - YYMMDD
     * (01) GTIN-14 - item barcode padded to 14 digits
     * (21) Serial Number - random digits (variable length, last AI)
     *
     * @param itemBarcode the 6-digit item barcode
     * @return GS1-128 formatted string (digits only)
     */
    public String buildPlacementBarcode(String itemBarcode) {
        if (itemBarcode == null || !itemBarcode.matches("\\d{" + ITEM_BARCODE_LENGTH + "}")) {
            throw new IllegalArgumentException(InventoryError.BARCODE_MUST_BE_6_DIGITS.name());
        }

        String datePart = LocalDate.now(ZoneOffset.UTC).format(GS1_DATE_FORMAT);

        // AI 11: Production Date (YYMMDD, 6 digits).
        String ai11 = "11" + datePart;

        // AI 01: GTIN-14 padded with leading zeros.
        String gtin14 = String.format("%0" + GTIN_14_LENGTH + "d", Long.parseLong(itemBarcode));
        String ai01 = "01" + gtin14;

        String barcode;
        int attempts = 0;
        do {
            if (attempts >= MAX_RETRY_ATTEMPTS) {
                throw new IllegalStateException(InventoryError.PLACEMENT_BARCODE_GENERATION_FAILED.name() + ": Unable to generate unique placement barcode after " + MAX_RETRY_ATTEMPTS + " attempts");
            }
            // AI 21: Serial Number (variable length, last AI so no FNC1 separator needed).
            String ai21 = "21" + CodeGenerator.generateWithNumbers(SERIAL_LENGTH);
            barcode = ai11 + ai01 + ai21;
            attempts++;
        } while (assortmentRepository.existsByBarcode(barcode));

        return barcode;
    }
}
