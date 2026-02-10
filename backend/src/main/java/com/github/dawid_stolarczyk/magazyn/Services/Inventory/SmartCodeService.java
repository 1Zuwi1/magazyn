package com.github.dawid_stolarczyk.magazyn.Services.Inventory;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.Assortment;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Item;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.AssortmentRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.ItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.function.Function;

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
     * Generic helper to find entities by smart code variations.
     * Handles multiple code format strategies to improve lookup success rate.
     *
     * @param code       The input code to search
     * @param finder     Function that tries to find by code variation
     * @param entityName Name of entity type for logging
     * @param <T>        Entity type
     * @return Found entity
     * @throws IllegalArgumentException if not found
     */
    private <T> T findByCodeVariations(String code, Function<String, Optional<T>> finder, String entityName) {
        log.debug("Searching for {} with smart code: {}", entityName, code);

        // Strategy 1: Try direct match first (fastest)
        Optional<T> entity = finder.apply(code);
        if (entity.isPresent()) {
            log.debug("{} found by direct match: {}", entityName, code);
            return entity.get();
        }

        // Strategy 2: Handle 14-digit codes without "01" prefix
        if (code.matches("\\d{14}")) {
            String codeWithPrefix = "01" + code;
            entity = finder.apply(codeWithPrefix);
            if (entity.isPresent()) {
                log.info("{} found by 14-digit code with added 01 prefix: {} -> {}", entityName, code, codeWithPrefix);
                return entity.get();
            }
        }

        // Strategy 3: Handle 16-digit codes - try removing "01" prefix
        if (code.matches("\\d{16}")) {
            String codeWithoutPrefix = code.substring(2);
            entity = finder.apply(codeWithoutPrefix);
            if (entity.isPresent()) {
                log.info("{} found by 16-digit code without 01 prefix: {} -> {}", entityName, code, codeWithoutPrefix);
                return entity.get();
            }
        }

        // Strategy 4: If 16-digit with 01 prefix was tried, try 14-digit part
        if (code.matches("01\\d{14}")) {
            String codePart = code.substring(2);
            entity = finder.apply(codePart);
            if (entity.isPresent()) {
                log.info("{} found by 16-digit code using 14-digit part: {} -> {}", entityName, code, codePart);
                return entity.get();
            }
        }

        // If all strategies fail, throw not found error
        log.warn("{} not found after trying all code variations: {}", entityName, code);
        throw new IllegalArgumentException(entityName.toUpperCase() + "_NOT_FOUND");
    }

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
        return findByCodeVariations(code, itemRepository::findByCodeOrQrCode, "item");
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
        return findByCodeVariations(code, assortmentRepository::findByCode, "assortment");
    }
}
