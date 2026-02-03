package com.github.dawid_stolarczyk.magazyn.Services.Inventory;

import com.github.dawid_stolarczyk.magazyn.Common.Enums.InventoryError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.AssortmentDto;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Assortment;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Item;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Rack;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Repositories.AssortmentRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.ItemRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.RackRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.UserRepository;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.AuthUtil;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.RateLimitOperation;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

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
    private final Bucket4jRateLimiter rateLimiter;

    private static final double EPS = 1e-6;

    public List<AssortmentDto> getAllAssortments(HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);
        return assortmentRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public AssortmentDto getAssortmentById(Long id, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);
        Assortment assortment = assortmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.ASSORTMENT_NOT_FOUND.name()));
        return mapToDto(assortment);
    }

    public AssortmentDto getAssortmentByBarcode(String barcode, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);
        Assortment assortment = assortmentRepository.findByBarcode(barcode)
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.ASSORTMENT_NOT_FOUND.name()));
        return mapToDto(assortment);
    }

    @Transactional
    public AssortmentDto createAssortment(AssortmentDto dto, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_WRITE);
        return createAssortmentInternal(dto);
    }

    /**
     * Internal method for bulk import - no rate limiting
     * Uses SERIALIZABLE isolation to prevent race conditions in barcode generation
     */
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public AssortmentDto createAssortmentInternal(AssortmentDto dto) {
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

        barcodeService.ensureItemBarcode(item);

        // Retry logic for race condition in barcode generation
        int maxRetries = 3;
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                String placementBarcode = barcodeService.buildPlacementBarcode(item.getBarcode());

                Assortment assortment = Assortment.builder()
                        .item(item)
                        .rack(rack)
                        .user(user)
                        .created_at(createdAt)
                        .expires_at(expiresAt)
                        .position_x(dto.getPositionX())
                        .position_y(dto.getPositionY())
                        .barcode(placementBarcode)
                        .build();

                return mapToDto(assortmentRepository.save(assortment));

            } catch (DataIntegrityViolationException ex) {
                // Check if it's a barcode collision (unique constraint violation)
                String message = ex.getMostSpecificCause().getMessage();
                boolean isBarcodeCollision = false;

                if (message != null) {
                    String lowerMessage = message.toLowerCase();
                    // Check for barcode-specific unique constraint violation
                    // MySQL: "Duplicate entry ... for key 'barcode'" or "for key 'UK_barcode'"
                    // PostgreSQL: "duplicate key value violates unique constraint"
                    isBarcodeCollision = (lowerMessage.contains("barcode") &&
                                         (lowerMessage.contains("duplicate") ||
                                          lowerMessage.contains("unique"))) ||
                                         lowerMessage.contains("uk_barcode") ||
                                         lowerMessage.contains("idx_barcode");
                }

                if (isBarcodeCollision) {
                    if (attempt < maxRetries) {
                        log.warn("Barcode collision detected on attempt {}/{}, retrying...", attempt, maxRetries);
                        // Small delay before retry to reduce collision probability
                        try {
                            Thread.sleep((long) 10 * attempt); // 10ms, 20ms, 30ms
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            throw new IllegalStateException("Interrupted during barcode retry", ie);
                        }
                        continue; // Retry
                    } else {
                        log.error("Failed to generate unique placement barcode after {} attempts", maxRetries);
                        throw new IllegalStateException(InventoryError.PLACEMENT_BARCODE_GENERATION_FAILED.name()
                                + ": Unable to generate unique barcode after " + maxRetries + " attempts");
                    }
                }
                // If it's not a barcode issue, re-throw immediately
                throw ex;
            }
        }

        // Should never reach here due to loop structure, but added for safety
        throw new IllegalStateException("Unexpected state in barcode generation");
    }

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
        assortment.setPosition_x(dto.getPositionX());
        assortment.setPosition_y(dto.getPositionY());
        if (dto.getExpiresAt() != null) {
            assortment.setExpires_at(dto.getExpiresAt());
        }

        return mapToDto(assortmentRepository.save(assortment));
    }

    @Transactional
    public void deleteAssortment(Long id, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_WRITE);
        Assortment assortment = assortmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.ASSORTMENT_NOT_FOUND.name()));
        assortmentRepository.delete(assortment);
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
                .anyMatch(a -> a.getPosition_x().equals(x) && a.getPosition_y().equals(y));
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
                .barcode(assortment.getBarcode())
                .itemId(assortment.getItem().getId())
                .rackId(assortment.getRack().getId())
                .userId(assortment.getUser() != null ? assortment.getUser().getId() : null)
                .createdAt(assortment.getCreated_at())
                .expiresAt(assortment.getExpires_at())
                .positionX(assortment.getPosition_x())
                .positionY(assortment.getPosition_y())
                .build();
    }
}
