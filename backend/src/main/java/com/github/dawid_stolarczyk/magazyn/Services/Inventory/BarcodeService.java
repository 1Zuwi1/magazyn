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
    private static final int ITEM_CODE_LENGTH = 16;
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
            code = CodeGenerator.generateWithNumbers(13);
            int checksum = CodeGenerator.calculateGTIN14Checksum(code);
            code += checksum;
            code = "01" + code; // Dodaj prefiks AI 01 do kodu GTIN-14
            attempts++;
        } while (itemRepository.existsByCode(code));
        return code;
    }

    public boolean checkUniqueItemCode(String code) {
        return !itemRepository.existsByCode(code);
    }

    public void ensureItemCode(Item item) {
        if (item.getCode() != null
                && !item.getCode().isBlank()
                && item.getCode().length() == ITEM_CODE_LENGTH
                && item.getCode().startsWith("01")) {
            return;
        }

        item.setCode(generateUniqueItemCode());
        itemRepository.save(item);
    }

    public boolean validateQrCode(String qrCode) {
        if (qrCode == null || qrCode.isBlank()) {
            return true;
        }
        return qrCode.startsWith("QR-") && qrCode.length() > 3;
    }

    public String generateQrCodeFromBarcode(String barcode) {
        return "QR-" + barcode;
    }

    /**
     * Builds a GS1-128 compliant barcode for an assortment.
     * Uses:
     * (11) Production Date - YYMMDD
     * (01) GTIN-14 - item code is 16 digits (01 prefix + 14-digit GTIN)
     * (21) Serial Number - random digits (variable length, last AI)
     *
     * @param itemCode the 16-digit item code (GS1-128 barcode with 01 prefix)
     * @return GS1-128 formatted barcode string (digits only)
     */
    public String buildPlacementCode(String itemCode) {
        if (itemCode == null || !itemCode.matches("\\d{" + ITEM_CODE_LENGTH + "}")) {
            throw new IllegalArgumentException(InventoryError.BARCODE_MUST_BE_16_DIGITS.name());
        }

        String datePart = LocalDate.now(ZoneOffset.UTC).format(GS1_DATE_FORMAT);

        // AI 11: Production Date (YYMMDD, 6 digits).
        String ai11 = "11" + datePart;


        String code;
        int attempts = 0;
        do {
            if (attempts >= MAX_RETRY_ATTEMPTS) {
                throw new IllegalStateException(InventoryError.PLACEMENT_BARCODE_GENERATION_FAILED.name() + ": Unable to generate unique barcode after " + MAX_RETRY_ATTEMPTS + " attempts");
            }
            // AI 21: Serial Number (variable length, last AI so no FNC1 separator needed).
            String ai21 = "21" + CodeGenerator.generateWithNumbers(SERIAL_LENGTH);
            code = ai11 + itemCode + ai21;
            attempts++;
        } while (assortmentRepository.existsByCode(code));

        return code;
    }
}
