package com.github.dawid_stolarczyk.magazyn.Services.Inventory;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.Assortment;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Item;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.AssortmentRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.ItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Smart code finding service for items and assortments.
 * Provides intelligent lookup by trying multiple code format variations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SmartCodeService {

    private final ItemRepository itemRepository;
    private final AssortmentRepository assortmentRepository;

    /**
     * Intelligently finds an item by trying multiple code format variations.
     * Handles:
     * 1. Direct match (exact code or QR code via findByCodeOrQrCode)
     * 2. 14-digit code without "01" prefix → tries with "01" prefix
     * 3. 16-digit code with "01" prefix → tries without "01" prefix
     *
     * @param code The code/identifier to search for
     * @return Found item or throws exception
     */
    public Item findItemBySmartCode(String code) {
        log.debug("Searching for item with smart code: {}", code);

        // Strategy 1: Try direct match first (fastest)
        Optional<Item> item = itemRepository.findByCodeOrQrCode(code);
        if (item.isPresent()) {
            log.debug("Item found by direct match: {}", code);
            return item.get();
        }

        // Strategy 2: Handle 14-digit codes without "01" prefix
        if (code.matches("\\d{14}")) {
            String codeWithPrefix = "01" + code;
            item = itemRepository.findByCodeOrQrCode(codeWithPrefix);
            if (item.isPresent()) {
                log.info("Item found by 14-digit code with added 01 prefix: {} -> {}", code, codeWithPrefix);
                return item.get();
            }
        }

        // Strategy 3: Handle 16-digit codes - try removing "01" prefix
        if (code.matches("\\d{16}")) {
            String codeWithoutPrefix = code.substring(2);
            item = itemRepository.findByCodeOrQrCode(codeWithoutPrefix);
            if (item.isPresent()) {
                log.info("Item found by 16-digit code without 01 prefix: {} -> {}", code, codeWithoutPrefix);
                return item.get();
            }
        }

        // Strategy 4: If 14-digit with 01 prefix was tried, try  14-digit part
        if (code.matches("01\\d{14}")) {
            String codePart = code.substring(2);
            item = itemRepository.findByCodeOrQrCode(codePart);
            if (item.isPresent()) {
                log.info("Item found by 16-digit code using 14-digit part: {} -> {}", code, codePart);
                return item.get();
            }
        }

        // If all strategies fail, throw not found error
        log.warn("Item not found after trying all code variations: {}", code);
        throw new IllegalArgumentException("ITEM_NOT_FOUND");
    }

    /**
     * Intelligently finds an assortment by trying multiple code format variations.
     * Handles:
     * 1. Direct match (exact code)
     * 2. 14-digit code without "01" prefix → tries with "01" prefix
     * 3. 16-digit code with "01" prefix → tries without "01" prefix
     *
     * @param code The code to search for
     * @return Found assortment or throws exception
     */
    public Assortment findAssortmentBySmartCode(String code) {
        log.debug("Searching for assortment with smart code: {}", code);

        // Strategy 1: Try direct match first (fastest)
        Optional<Assortment> assortment = assortmentRepository.findByCode(code);
        if (assortment.isPresent()) {
            log.debug("Assortment found by direct match: {}", code);
            return assortment.get();
        }

        // Strategy 2: Handle 14-digit codes without "01" prefix
        if (code.matches("\\d{14}")) {
            String codeWithPrefix = "01" + code;
            assortment = assortmentRepository.findByCode(codeWithPrefix);
            if (assortment.isPresent()) {
                log.info("Assortment found by 14-digit code with added 01 prefix: {} -> {}", code, codeWithPrefix);
                return assortment.get();
            }
        }

        // Strategy 3: Handle 16-digit codes - try removing "01" prefix
        if (code.matches("\\d{16}")) {
            String codeWithoutPrefix = code.substring(2);
            assortment = assortmentRepository.findByCode(codeWithoutPrefix);
            if (assortment.isPresent()) {
                log.info("Assortment found by 16-digit code without 01 prefix: {} -> {}", code, codeWithoutPrefix);
                return assortment.get();
            }
        }

        // Strategy 4: If 14-digit with 01 prefix was tried, try 14-digit part
        if (code.matches("01\\d{14}")) {
            String codePart = code.substring(2);
            assortment = assortmentRepository.findByCode(codePart);
            if (assortment.isPresent()) {
                log.info("Assortment found by 16-digit code using 14-digit part: {} -> {}", code, codePart);
                return assortment.get();
            }
        }

        // If all strategies fail, throw not found error
        log.warn("Assortment not found after trying all code variations: {}", code);
        throw new IllegalArgumentException("ASSORTMENT_NOT_FOUND");
    }
}
