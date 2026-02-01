package com.github.dawid_stolarczyk.magazyn.Services.Inventory;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.Item;
import com.github.dawid_stolarczyk.magazyn.Repositories.ItemRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.AssortmentRepository;
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
    private final ItemRepository itemRepository;
    private final AssortmentRepository assortmentRepository;

    public String generateUniqueItemBarcode() {
        String barcode;
        do {
            barcode = CodeGenerator.generateWithNumbers(14);
        } while (itemRepository.existsByBarcode(barcode));
        return barcode;
    }

    public void ensureItemBarcode(Item item) {
        if (item.getBarcode() != null && !item.getBarcode().isBlank() && item.getBarcode().length() == 14) {
            return;
        }
        item.setBarcode(generateUniqueItemBarcode());
        itemRepository.save(item);
    }

    /**
     * Builds a GS1-128 compliant barcode for an assortment.
     * Uses:
     * (11) Production Date - YYMMDD
     * (01) GTIN - item barcode (original length)
     * (21) Serial Number - random digits
     *
     * @param itemBarcode  the 6-digit item barcode
     * @return GS1-128 formatted string (digits only)
     */
    public String buildPlacementBarcode(String itemBarcode) {
        String datePart = LocalDate.now(ZoneOffset.UTC).format(GS1_DATE_FORMAT);

        // AI 11: Production Date (YYMMDD, 6 digits).
        String ai11 = "11" + datePart;

        // AI 01: GTIN - use original item barcode without padding.
        String ai01 = "01" + itemBarcode;

        String barcode;
        do {
            // AI 21: Serial Number (variable length, random digits).
            String ai21 = "21" + CodeGenerator.generateWithNumbers(SERIAL_LENGTH);
            barcode = ai11 + ai01 + ai21;
        } while (assortmentRepository.existsByBarcode(barcode));

        return barcode;
    }
}
