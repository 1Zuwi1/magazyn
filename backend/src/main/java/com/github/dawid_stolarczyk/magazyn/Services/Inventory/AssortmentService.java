package com.github.dawid_stolarczyk.magazyn.Services.Inventory;

import com.github.dawid_stolarczyk.magazyn.Common.Enums.InventoryError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.AssortmentDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.AssortmentWithItemDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ItemDto;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Assortment;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Item;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Rack;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.ExpiryFilters;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.AssortmentRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.ItemRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.RackRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.UserRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.Specification.AssortmentSpecifications;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.AuthUtil;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.RateLimitOperation;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static com.github.dawid_stolarczyk.magazyn.Utils.InternetUtils.getClientIp;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssortmentService {
    private final AssortmentRepository assortmentRepository;
    private final ItemRepository itemRepository;
    private final RackRepository rackRepository;
    private final UserRepository userRepository;
    private final BarcodeService barcodeService;
    private final SmartCodeService smartCodeService;
    private final Bucket4jRateLimiter rateLimiter;

    private static final double EPS = 1e-6;

    public Page<AssortmentDto> getAllAssortmentsPaged(
            HttpServletRequest request,
            Pageable pageable,
            ArrayList<ExpiryFilters> expiryFilters,
            String search,
            Boolean weekToExpire) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);

        var spec = AssortmentSpecifications.withFilters(
                search, weekToExpire, null, null, null);

        Page<AssortmentDto> page = assortmentRepository.findAll(spec, pageable)
                .map(this::mapToDto);

        if (!expiryFilters.isEmpty() && !expiryFilters.contains(ExpiryFilters.ALL)) {
            Instant now = Instant.now();
            int maxDays = expiryFilters.stream()
                    .filter(f -> f != ExpiryFilters.EXPIRED)
                    .mapToInt(f -> Integer.parseInt(f.name().split("_")[1]))
                    .max()
                    .orElse(0);
            Instant threshold = now.plus(maxDays, ChronoUnit.DAYS);
            log.info("Applying expiry filters: {}, threshold date: {}", expiryFilters, threshold);


            page = new PageImpl<>(page
                    .stream()
                    .filter(dto -> dto.getExpiresAt() != null
                            && dto.getExpiresAt().toInstant().isBefore(threshold)
                            && dto.getExpiresAt().toInstant().isAfter(now)
                            || (dto.getExpiresAt() != null
                            && expiryFilters.contains(ExpiryFilters.EXPIRED)
                            && dto.getExpiresAt().toInstant().isBefore(now))
                    )
                    .toList(), pageable, page.getTotalElements());
        }
        return page;
    }

    public Page<AssortmentWithItemDto> getAssortmentsByRackIdPaged(
            Long rackId,
            HttpServletRequest request,
            Pageable pageable,
            String search,
            Integer positionX,
            Integer positionY,
            Boolean weekToExpire) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);

        // Validate rack exists
        if (!rackRepository.existsById(rackId)) {
            throw new IllegalArgumentException(InventoryError.RACK_NOT_FOUND.name());
        }

        var spec = AssortmentSpecifications.withFilters(
                search, weekToExpire, rackId, positionX, positionY);

        return assortmentRepository.findAll(spec, pageable)
                .map(this::mapToDtoWithItem);
    }

    public Page<AssortmentWithItemDto> getAssortmentsByWarehouseIdPaged(Long warehouseId, HttpServletRequest request, Pageable pageable) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);

        return assortmentRepository.findByRack_WarehouseId(warehouseId, pageable)
                .map(this::mapToDtoWithItem);
    }

    public AssortmentDto getAssortmentById(Long id, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);
        Assortment assortment = assortmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.ASSORTMENT_NOT_FOUND.name()));
        return mapToDto(assortment);
    }

    public AssortmentDto getAssortmentByCode(String code, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);
        Assortment assortment = smartCodeService.findAssortmentBySmartCode(code);
        return mapToDto(assortment);
    }

    /**
     * Internal method for bulk import - no rate limiting
     * Uses SERIALIZABLE isolation to prevent race conditions in code (barcode) generation
     */
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public void createAssortmentInternal(AssortmentDto dto) {
        Item item = itemRepository.findById(dto.getItemId())
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.ITEM_NOT_FOUND.name()));
        Rack rack = rackRepository.findById(dto.getRackId())
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.RACK_NOT_FOUND.name()));

        User user = userRepository.findById(AuthUtil.getCurrentAuthPrincipal().getUserId())
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.USER_NOT_FOUND.name()));

        validatePlacement(rack, item, dto.getPositionX(), dto.getPositionY(), null);

        Timestamp createdAt = Timestamp.from(Instant.now());
        Timestamp expiresAt;
        if (dto.getExpiresAt() != null) {
            if (dto.getExpiresAt().before(createdAt)) {
                throw new IllegalArgumentException(InventoryError.INVALID_EXPIRY_DATE.name());
            }
            expiresAt = dto.getExpiresAt();
        } else {
            expiresAt = Timestamp.from(Instant.now().plus(item.getExpireAfterDays(), ChronoUnit.DAYS));
        }

        barcodeService.ensureItemCode(item);

        // Retry logic for race condition in code (barcode) generation
        int maxRetries = 3;
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                String placementCode = barcodeService.buildPlacementCode(item.getCode());

                Assortment assortment = Assortment.builder()
                        .item(item)
                        .rack(rack)
                        .user(user)
                        .createdAt(createdAt)
                        .expiresAt(expiresAt)
                        .positionX(dto.getPositionX())
                        .positionY(dto.getPositionY())
                        .code(placementCode)
                        .build();

                mapToDto(assortmentRepository.save(assortment));
                return;

            } catch (DataIntegrityViolationException ex) {
                // Check if it's a code collision (unique constraint violation)
                String message = ex.getMostSpecificCause().getMessage();
                boolean isCodeCollision = false;

                if (message != null) {
                    String lowerMessage = message.toLowerCase();
                    // Check for code-specific unique constraint violation
                    // MySQL: "Duplicate entry ... for key 'code'" or "for key 'UK_code'"
                    // PostgreSQL: "duplicate key value violates unique constraint"
                    isCodeCollision = (lowerMessage.contains("code") &&
                            (lowerMessage.contains("duplicate") ||
                                    lowerMessage.contains("unique"))) ||
                            lowerMessage.contains("uk_code") ||
                            lowerMessage.contains("idx_code");
                }

                if (isCodeCollision) {
                    if (attempt < maxRetries) {
                        log.warn("Code collision detected on attempt {}/{}, retrying...", attempt, maxRetries);
                        // Small delay before retry to reduce collision probability
                        try {
                            Thread.sleep((long) 10 * attempt); // 10ms, 20ms, 30ms
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            throw new IllegalStateException("Interrupted during code retry", ie);
                        }
                        continue; // Retry
                    } else {
                        log.error("Failed to generate unique placement code (barcode) after {} attempts", maxRetries);
                        throw new IllegalStateException(InventoryError.PLACEMENT_BARCODE_GENERATION_FAILED.name()
                                + ": Unable to generate unique code after " + maxRetries + " attempts");
                    }
                }
                // If it's not a code issue, re-throw immediately
                throw ex;
            }
        }

        // Should never reach here due to loop structure, but added for safety
        throw new IllegalStateException("Unexpected state in code generation");
    }

    @Transactional
    public AssortmentDto updateAssortmentMetadata(Long id, AssortmentDto dto, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_WRITE);
        Assortment assortment = assortmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.ASSORTMENT_NOT_FOUND.name()));

        // Validate that position, rack, and item are NOT being changed
        if (dto.getPositionX() != null && !dto.getPositionX().equals(assortment.getPositionX())) {
            throw new IllegalArgumentException("POSITION_UPDATE_FORBIDDEN: Use inbound/outbound operations to move assortments");
        }
        if (dto.getPositionY() != null && !dto.getPositionY().equals(assortment.getPositionY())) {
            throw new IllegalArgumentException("POSITION_UPDATE_FORBIDDEN: Use inbound/outbound operations to move assortments");
        }
        if (dto.getRackId() != null && !dto.getRackId().equals(assortment.getRack().getId())) {
            throw new IllegalArgumentException("RACK_UPDATE_FORBIDDEN: Use inbound/outbound operations to move assortments");
        }
        if (dto.getItemId() != null && !dto.getItemId().equals(assortment.getItem().getId())) {
            throw new IllegalArgumentException("ITEM_UPDATE_FORBIDDEN: Cannot change item of an assortment");
        }

        // Only allow updating expiration date
        if (dto.getExpiresAt() != null) {
            if (dto.getExpiresAt().before(assortment.getCreatedAt())) {
                throw new IllegalArgumentException(InventoryError.INVALID_EXPIRY_DATE.name());
            }
            assortment.setExpiresAt(dto.getExpiresAt());
        }

        return mapToDto(assortmentRepository.save(assortment));
    }

    @Deprecated
    @Transactional
    public AssortmentDto updateAssortment(Long id, AssortmentDto dto, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_WRITE);
        Assortment assortment = assortmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.ASSORTMENT_NOT_FOUND.name()));

        Item item = itemRepository.findById(dto.getItemId())
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.ITEM_NOT_FOUND.name()));
        Rack rack = rackRepository.findById(dto.getRackId())
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.RACK_NOT_FOUND.name()));

        validatePlacement(rack, item, dto.getPositionX(), dto.getPositionY(), id);

        assortment.setItem(item);
        assortment.setRack(rack);
        assortment.setPositionX(dto.getPositionX());
        assortment.setPositionY(dto.getPositionY());
        if (dto.getExpiresAt() != null) {
            assortment.setExpiresAt(dto.getExpiresAt());
        }

        return mapToDto(assortmentRepository.save(assortment));
    }

    private void validatePlacement(Rack rack, Item item, Integer x, Integer y, Long excludeAssortmentId) {
        // Val d: Dimensions of the rack
        if (x < 1 || x > rack.getSize_x() || y < 1 || y > rack.getSize_y()) {
            throw new IllegalArgumentException(InventoryError.POSITION_OUT_OF_BOUNDS.name());
        }

        // Val d: Item dimensions vs Rack max dimensions
        if (!lessOrEqualWithEps(item.getSize_x(), rack.getMax_size_x()) ||
                !lessOrEqualWithEps(item.getSize_y(), rack.getMax_size_y()) ||
                !lessOrEqualWithEps(item.getSize_z(), rack.getMax_size_z())) {
            throw new IllegalArgumentException(InventoryError.ITEM_TOO_LARGE_FOR_RACK.name());
        }

        // Val d: Temperature
        if (item.getMin_temp() < rack.getMin_temp() || item.getMax_temp() > rack.getMax_temp()) {
            throw new IllegalArgumentException(InventoryError.TEMPERATURE_MISMATCH.name());
        }

        // Val d: Weight
        double currentWeight = rack.getAssortments().stream()
                .filter(a -> excludeAssortmentId == null || !a.getId().equals(excludeAssortmentId))
                .mapToDouble(a -> a.getItem().getWeight())
                .sum();
        if (currentWeight + item.getWeight() > rack.getMax_weight()) {
            throw new IllegalArgumentException(InventoryError.RACK_WEIGHT_LIMIT_EXCEEDED.name());
        }

        // Val d: Dangerous items
        if (item.isDangerous() && !rack.isAcceptsDangerous()) {
            throw new IllegalArgumentException(InventoryError.RACK_DOES_NOT_ACCEPT_DANGEROUS_ITEMS.name());
        }

        // Val d: Position occupied
        boolean occupied = rack.getAssortments().stream()
                .filter(a -> excludeAssortmentId == null || !a.getId().equals(excludeAssortmentId))
                .anyMatch(a -> a.getPositionX().equals(x) && a.getPositionY().equals(y));
        if (occupied) {
            throw new IllegalArgumentException(InventoryError.POSITION_ALREADY_OCCUPIED.name());
        }
    }

    private boolean lessOrEqualWithEps(double a, double b) {
        return a <= b || Math.abs(a - b) < EPS;
    }

    private AssortmentDto mapToDto(Assortment assortment) {
        return AssortmentDto.builder()
                .id(assortment.getId())
                .code(assortment.getCode())
                .itemId(assortment.getItem().getId())
                .rackId(assortment.getRack().getId())
                .userId(assortment.getUser() != null ? assortment.getUser().getId() : null)
                .createdAt(assortment.getCreatedAt())
                .expiresAt(assortment.getExpiresAt())
                .positionX(assortment.getPositionX())
                .positionY(assortment.getPositionY())
                .build();
    }

    private AssortmentWithItemDto mapToDtoWithItem(Assortment assortment) {
        Item item = assortment.getItem();
        ItemDto itemDto = ItemDto.builder()
                .id(item.getId())
                .code(item.getCode())
                .name(item.getName())
                .photoUrl(item.getPhoto_url())
                .minTemp(item.getMin_temp())
                .maxTemp(item.getMax_temp())
                .weight(item.getWeight())
                .sizeX(item.getSize_x())
                .sizeY(item.getSize_y())
                .sizeZ(item.getSize_z())
                .comment(item.getComment())
                .expireAfterDays(item.getExpireAfterDays())
                .isDangerous(item.isDangerous())
                .build();

        return AssortmentWithItemDto.builder()
                .id(assortment.getId())
                .code(assortment.getCode())
                .rackId(assortment.getRack().getId())
                .userId(assortment.getUser() != null ? assortment.getUser().getId() : null)
                .createdAt(assortment.getCreatedAt())
                .expiresAt(assortment.getExpiresAt())
                .positionX(assortment.getPositionX())
                .positionY(assortment.getPositionY())
                .item(itemDto)
                .build();
    }
}
