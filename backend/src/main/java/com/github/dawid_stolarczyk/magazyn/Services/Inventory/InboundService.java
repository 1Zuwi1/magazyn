package com.github.dawid_stolarczyk.magazyn.Services.Inventory;

import com.github.dawid_stolarczyk.magazyn.Common.Enums.InventoryError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.*;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.*;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.*;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.AuthUtil;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.RateLimitOperation;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.DateTimeException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

import static com.github.dawid_stolarczyk.magazyn.Utils.InternetUtils.getClientIp;

@Service
@AllArgsConstructor
@Slf4j
public class InboundService {
    private static final int MAX_EXPIRE_DAYS = 3650;
    private static final int MAX_RACK_SIDE = 1000;
    private static final int MAX_RACK_AREA = 1_000_000;
    private static final double EPS = 1e-6;
    private static final int RESERVATION_MINUTES = 5;

    private final ItemRepository itemRepository;
    private final RackRepository rackRepository;
    private final AssortmentRepository assortmentRepository;
    private final UserRepository userRepository;
    private final WarehouseRepository warehouseRepository;
    private final BarcodeService barcodeService;
    private final PositionReservationRepository reservationRepository;
    private final InboundOperationRepository inboundOperationRepository;
    private final Bucket4jRateLimiter rateLimiter;


    @Transactional
    public PlacementPlanResult buildPlacementPlan(PlacementPlanRequest request, HttpServletRequest httpRequest) {
        rateLimiter.consumeOrThrow(getClientIp(httpRequest), RateLimitOperation.INVENTORY_WRITE);
        Item item = itemRepository.findById(request.getItemId())
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.ITEM_NOT_FOUND.name()));

        if (request.getWarehouseId() != null && !warehouseRepository.existsById(request.getWarehouseId())) {
            throw new IllegalArgumentException(InventoryError.WAREHOUSE_NOT_FOUND.name());
        }

        User user = userRepository.findById(AuthUtil.getCurrentAuthPrincipal().getUserId())
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.USER_NOT_FOUND.name()));
        Timestamp now = Timestamp.from(Instant.now());
        Instant expiryInstant = Instant.now().plus(RESERVATION_MINUTES, ChronoUnit.MINUTES);
        Timestamp expiryTimestamp = Timestamp.from(expiryInstant);

        List<Rack> racks = request.getWarehouseId() == null
                ? rackRepository.findAll()
                : rackRepository.findByWarehouseId(request.getWarehouseId());

        List<RackCapacity> candidates = new ArrayList<>();

        log.debug("[PLAN] ═══ SCANNING {} racks in warehouse {} for item #{} (weight={}kg)",
                racks.size(), request.getWarehouseId(), item.getId(), item.getWeight());

        for (Rack rack : racks) {
            // Pobierz wolne pozycje z uwzględnieniem rezerwacji innych użytkowników
            RackCapacity capacity = resolveRackCapacityWithReservations(rack, item, user.getId(), now);
            if (capacity != null && capacity.availableCount() > 0) {
                candidates.add(capacity);
                log.debug("[PLAN] ✓ Rack #{} (marker={}, size={}x{}) → {} available positions",
                        rack.getId(), rack.getMarker(), rack.getSize_x(), rack.getSize_y(), capacity.availableCount());
            } else {
                log.debug("[PLAN] ✗ Rack #{} (marker={}) SKIPPED | capacity={}",
                        rack.getId(), rack.getMarker(), capacity == null ? "null (no match)" : capacity.availableCount());
            }
        }

        // Suma wszystkich dostępnych pozycji
        int totalAvailable = candidates.stream().mapToInt(RackCapacity::availableCount).sum();
        log.debug("[PLAN] ═══ SUMMARY: {} total available positions | {} requested | User: {}",
                totalAvailable, request.getQuantity(), user.getId());

        if (candidates.isEmpty()) {
            return PlacementPlanResult.noMatch(InventoryError.NO_REGALS_MATCH);
        }

        // Algorytm grupowania - regały według bliskości
        candidates = groupRacksByProximity(candidates);

        int remaining = request.getQuantity();
        List<PlacementSlotResponse> placements = new ArrayList<>();
        List<PositionReservation> newReservations = new ArrayList<>();

        // Zbieraj pozycje z wielu regałów, dopóki nie zbierzemy wszystkich lub nie skończą się regały
        for (RackCapacity capacity : candidates) {
            if (remaining <= 0) {
                break;
            }
            int allocate = Math.min(remaining, capacity.availableCount());

            log.debug("[PLAN] → Allocating {} positions from Rack #{} (available: {}, remaining: {})",
                    allocate, capacity.rack().getId(), capacity.availableCount(), remaining);

            // Grupuj koordynaty według bliskości (wypełnianie "wąż")
            List<Coordinate> grouped = groupCoordinatesByProximity(capacity.freeCoordinates());

            for (int i = 0; i < allocate; i++) {
                Coordinate coordinate = grouped.get(i);
                PlacementSlotResponse slot = new PlacementSlotResponse();
                slot.setRackId(capacity.rack().getId());
                slot.setRackMarker(capacity.rack().getMarker());
                slot.setPositionX(coordinate.x());
                slot.setPositionY(coordinate.y());
                placements.add(slot);

                // Przygotuj rezerwację jeśli użytkownik tego zażądał
                if (Boolean.TRUE.equals(request.getReserve())) {
                    PositionReservation reservation = new PositionReservation(
                            capacity.rack(),
                            coordinate.x(),
                            coordinate.y(),
                            user,
                            expiryTimestamp
                    );
                    newReservations.add(reservation);
                }
            }
            remaining -= allocate;
        }

        // Zapisz rezerwacje jeśli użytkownik tego zażądał
        int reservedCount = 0;
        if (Boolean.TRUE.equals(request.getReserve()) && !newReservations.isEmpty()) {
            try {
                reservationRepository.saveAll(newReservations);
                reservedCount = newReservations.size();
                log.info("[RESERVATION] ✓ Created {} position reservations | User: {} | Expires: {}",
                        reservedCount, user.getId(), expiryInstant);
            } catch (DataIntegrityViolationException ex) {
                // Konflikt - ktoś właśnie zarezerwował te same pozycje
                log.warn("[RESERVATION] ✗ Conflict detected for User: {} | Someone reserved same positions", user.getId());
                throw new IllegalArgumentException(InventoryError.PLACEMENT_INVALID.name());
            }
        }

        PlacementPlanResponse response = new PlacementPlanResponse();
        response.setItemId(item.getId());
        response.setRequestedQuantity(request.getQuantity());
        response.setAllocatedQuantity(request.getQuantity() - remaining);
        response.setRemainingQuantity(remaining);
        response.setPlacements(placements);
        response.setReserved(Boolean.TRUE.equals(request.getReserve()));

        if (Boolean.TRUE.equals(request.getReserve())) {
            response.setReservedUntil(expiryInstant);
            response.setReservedCount(reservedCount);
        }

        if (response.getAllocatedQuantity() == 0) {
            log.warn("[PLAN] ✗ No positions allocated | requested: {} | available total: {}",
                    request.getQuantity(), totalAvailable);
            return PlacementPlanResult.noMatch(InventoryError.NO_REGALS_MATCH);
        }

        if (remaining > 0) {
            log.warn("[PLAN] ⚠ Partial allocation | requested: {} | allocated: {} | remaining: {} | available was: {}",
                    request.getQuantity(), response.getAllocatedQuantity(), remaining, totalAvailable);
            throw new IllegalArgumentException(InventoryError.INSUFFICIENT_SPACE.name());
        }

        log.info("[PLAN] ✓ Full allocation successful | requested: {} | allocated from {} rack(s)",
                request.getQuantity(), placements.stream().map(PlacementSlotResponse::getRackId).distinct().count());

        return PlacementPlanResult.full(response);
    }

    /**
     * Confirms placement and stores items in inventory.
     * <p>
     * Note: This method has a known race condition window between validation (line 138)
     * and insertion (line 173). Concurrent calls may validate against the same state
     * and attempt to insert conflicting positions. This is mitigated by:
     * <ul>
     *   <li>@Transactional isolation</li>
     *   <li>Catching DataIntegrityViolationException and returning PLACEMENT_INVALID</li>
     * </ul>
     * <p>
     * Future improvements could include:
     * <ul>
     *   <li>Adding DB unique constraint on (rack_id, position_x, position_y)</li>
     *   <li>Plan validation token/checksum to verify unmodified plan data</li>
     *   <li>Pessimistic locking with SELECT FOR UPDATE</li>
     * </ul>
     *
     * @param request Placement confirmation request with item and positions
     * @return Placement confirmation response with stored quantity
     * @throws IllegalArgumentException if placement is invalid or conflicts occur
     */
    @Transactional
    public PlacementConfirmationResponse confirmPlacement(PlacementConfirmationRequest request, HttpServletRequest httpRequest) {
        rateLimiter.consumeOrThrow(getClientIp(httpRequest), RateLimitOperation.INVENTORY_WRITE);
        // Walidacja żeby tylko itemId lub code było podane
        request.validate();

        // Znajdź item na podstawie itemId lub code (barcode)
        Item item;
        if (request.getItemId() != null) {
            item = itemRepository.findById(request.getItemId())
                    .orElseThrow(() -> new IllegalArgumentException(InventoryError.ITEM_NOT_FOUND.name()));
        } else {
            item = itemRepository.findByCode(request.getCode())
                    .orElseThrow(() -> new IllegalArgumentException(InventoryError.ITEM_NOT_FOUND.name()));
        }

        User user = userRepository.findById(AuthUtil.getCurrentAuthPrincipal().getUserId())
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.USER_NOT_FOUND.name()));

        Timestamp now = Timestamp.from(Instant.now());

        Map<Long, List<PlacementSlotRequest>> placementsByRack = new HashMap<>();
        for (PlacementSlotRequest slot : request.getPlacements()) {
            placementsByRack.computeIfAbsent(slot.getRackId(), ignored -> new ArrayList<>()).add(slot);
        }

        List<Assortment> newAssortments = new ArrayList<>();
        List<PositionReservation> reservationsToDelete = new ArrayList<>();
        Timestamp createdAt = Timestamp.from(Instant.now());
        Timestamp expiresAt = null;
        if (item.getExpireAfterDays() != null) {
            expiresAt = calculateExpiresAt(item.getExpireAfterDays(), createdAt.toInstant());
        }

        barcodeService.ensureItemCode(item);

        for (Map.Entry<Long, List<PlacementSlotRequest>> entry : placementsByRack.entrySet()) {
            Rack rack = rackRepository.findById(entry.getKey())
                    .orElseThrow(() -> new IllegalArgumentException(InventoryError.PLACEMENT_INVALID.name()));
            validateRackDimensions(rack);
            validateItemRackCompatibility(rack, item);
            List<Assortment> existingAssortments = assortmentRepository.findByRackId(rack.getId());
            RackCapacity capacity = resolveRackCapacity(rack, item, existingAssortments);
            int neededSlots = entry.getValue().size();
            if (capacity == null || neededSlots > capacity.availableCount()) {
                throw new IllegalArgumentException(InventoryError.PLACEMENT_INVALID.name());
            }
            Set<Coordinate> occupied = new HashSet<>();
            for (Assortment assortment : existingAssortments) {
                if (assortment.getPositionX() != null && assortment.getPositionY() != null) {
                    occupied.add(new Coordinate(assortment.getPositionX(), assortment.getPositionY()));
                }
            }
            Set<Coordinate> usedInRequest = new HashSet<>();
            for (PlacementSlotRequest slot : entry.getValue()) {
                if (slot.getPositionX() < 1 || slot.getPositionX() > rack.getSize_x()
                        || slot.getPositionY() < 1 || slot.getPositionY() > rack.getSize_y()) {
                    throw new IllegalArgumentException(InventoryError.PLACEMENT_INVALID.name());
                }
                Coordinate coordinate = new Coordinate(slot.getPositionX(), slot.getPositionY());
                if (occupied.contains(coordinate) || !usedInRequest.add(coordinate)) {
                    throw new IllegalArgumentException(InventoryError.PLACEMENT_INVALID.name());
                }

                // Sprawdź rezerwację dla tej pozycji
                Optional<PositionReservation> existingReservation = reservationRepository
                        .findActiveReservation(rack.getId(), slot.getPositionX(), slot.getPositionY(), now);

                if (existingReservation.isPresent()) {
                    PositionReservation reservation = existingReservation.get();
                    // Jeśli rezerwacja należy do innego użytkownika - odrzuć
                    if (!reservation.belongsTo(user.getId())) {
                        log.warn("[CONFIRM] ✗ Position ({},{}) in Rack #{} is reserved by another user",
                                slot.getPositionX(), slot.getPositionY(), rack.getId());
                        throw new IllegalArgumentException(InventoryError.PLACEMENT_INVALID.name());
                    }
                    // Rezerwacja należy do tego użytkownika - zaplanuj do usunięcia
                    reservationsToDelete.add(reservation);
                    log.debug("[CONFIRM] ✓ Position ({},{}) in Rack #{} reserved by current user - will release",
                            slot.getPositionX(), slot.getPositionY(), rack.getId());
                }

                Assortment assortment = new Assortment();
                assortment.setItem(item);
                assortment.setRack(rack);
                assortment.setUser(user);
                assortment.setCreatedAt(createdAt);
                assortment.setExpiresAt(expiresAt);
                assortment.setPositionX(slot.getPositionX());
                assortment.setPositionY(slot.getPositionY());
                newAssortments.add(assortment);
            }
        }

        try {
            assortmentRepository.saveAll(newAssortments);
        } catch (DataIntegrityViolationException ex) {
            // jeśli wystąpi konflikt z powodu równoległego wstawienia tej samej pozycji
            throw new IllegalArgumentException(InventoryError.PLACEMENT_INVALID.name());
        }

        for (Assortment assortment : newAssortments) {
            if (assortment.getCode() == null || assortment.getCode().isBlank()) {
                assortment.setCode(barcodeService.buildPlacementCode(item.getCode()));
            }
        }
        assortmentRepository.saveAll(newAssortments);

        // Tworzenie wpisów audytowych dla każdego przyjęcia
        List<InboundOperation> inboundOperations = new ArrayList<>();
        for (Assortment assortment : newAssortments) {
            InboundOperation operation = new InboundOperation();
            operation.setItem(assortment.getItem());
            operation.setRack(assortment.getRack());
            operation.setAssortment(assortment);
            operation.setReceivedBy(user);
            operation.setOperationTimestamp(createdAt);
            operation.setPositionX(assortment.getPositionX());
            operation.setPositionY(assortment.getPositionY());
            operation.setQuantity(1);
            inboundOperations.add(operation);
        }
        inboundOperationRepository.saveAll(inboundOperations);

        log.info("[AUDIT] ✓ Created {} inbound operation audit records | User: {} | Item: {}",
                inboundOperations.size(), user.getId(), item.getId());

        // Usuń rezerwacje po udanym umieszczeniu
        if (!reservationsToDelete.isEmpty()) {
            reservationRepository.deleteAll(reservationsToDelete);
            log.info("[CONFIRM] ✓ Released {} position reservations after successful placement | User: {}",
                    reservationsToDelete.size(), user.getId());
        }

        PlacementConfirmationResponse response = new PlacementConfirmationResponse();
        response.setItemId(item.getId());
        response.setStoredQuantity(newAssortments.size());
        response.setCodes(newAssortments.stream()
                .map(Assortment::getCode)
                .toList());
        return response;
    }

    /**
     * Validates if item can be placed on rack. Throws detailed exceptions for placement validation.
     */
    private void validateItemRackCompatibility(Rack rack, Item item) {
        Objects.requireNonNull(rack, "rack");
        Objects.requireNonNull(item, "item");

        if (item.isDangerous() && !rack.isAcceptsDangerous()) {
            log.debug("[MATCH] ✗ Rack #{} rejected: item is dangerous but rack doesn't accept dangerous items",
                    rack.getId());
            throw new IllegalArgumentException(InventoryError.RACK_DOES_NOT_ACCEPT_DANGEROUS_ITEMS.name());
        }

        if (rack.getMin_temp() < item.getMin_temp()) {
            log.debug("[MATCH] ✗ Rack #{} rejected: rack.min_temp ({}) < item.min_temp ({}) - rack goes below item tolerance",
                    rack.getId(), rack.getMin_temp(), item.getMin_temp());
            throw new IllegalArgumentException(InventoryError.RACK_TEMP_MIN_BELOW_ITEM_TOLERANCE.name());
        }

        if (rack.getMax_temp() > item.getMax_temp()) {
            log.debug("[MATCH] ✗ Rack #{} rejected: rack.max_temp ({}) > item.max_temp ({}) - rack exceeds item tolerance",
                    rack.getId(), rack.getMax_temp(), item.getMax_temp());
            throw new IllegalArgumentException(InventoryError.RACK_TEMP_MAX_ABOVE_ITEM_TOLERANCE.name());
        }

        if (!lessOrEqualWithEps(item.getSize_x(), rack.getMax_size_x())) {
            log.debug("[MATCH] ✗ Rack #{} rejected: item.size_x ({}) > rack.max_size_x ({})",
                    rack.getId(), item.getSize_x(), rack.getMax_size_x());
            throw new IllegalArgumentException(InventoryError.ITEM_SIZE_X_EXCEEDS_RACK_LIMIT.name());
        }

        if (!lessOrEqualWithEps(item.getSize_y(), rack.getMax_size_y())) {
            log.debug("[MATCH] ✗ Rack #{} rejected: item.size_y ({}) > rack.max_size_y ({})",
                    rack.getId(), item.getSize_y(), rack.getMax_size_y());
            throw new IllegalArgumentException(InventoryError.ITEM_SIZE_Y_EXCEEDS_RACK_LIMIT.name());
        }

        if (!lessOrEqualWithEps(item.getSize_z(), rack.getMax_size_z())) {
            log.debug("[MATCH] ✗ Rack #{} rejected: item.size_z ({}) > rack.max_size_z ({})",
                    rack.getId(), item.getSize_z(), rack.getMax_size_z());
            throw new IllegalArgumentException(InventoryError.ITEM_SIZE_Z_EXCEEDS_RACK_LIMIT.name());
        }
    }

    /**
     * Legacy method - returns boolean for plan filtering
     */
    private boolean rackMatchesItem(Rack rack, Item item) {
        try {
            validateItemRackCompatibility(rack, item);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private boolean lessOrEqualWithEps(double a, double b) {
        return a <= b || Math.abs(a - b) < EPS;
    }

    private RackCapacity resolveRackCapacity(Rack rack, Item item) {
        List<Assortment> assortments = assortmentRepository.findByRackId(rack.getId());
        return resolveRackCapacity(rack, item, assortments);
    }

    private RackCapacity resolveRackCapacity(Rack rack, Item item, List<Assortment> assortments) {
        validateRackDimensions(rack);
        if (!rackMatchesItem(rack, item)) {
            return null;
        }

        // Oblicz aktualnie załadowaną wagę
        double currentLoad = assortments.stream()
                .map(Assortment::getItem)
                .mapToDouble(Item::getWeight)
                .sum();

        int totalSlots = safeTotalSlots(rack);
        int occupiedSlots = assortments.size();
        int availableSlots = Math.max(0, totalSlots - occupiedSlots);
        double itemWeight = item.getWeight();

        // Oblicz ile itemów można dodać ze względu na limit wagi
        int maxByWeight;
        if (itemWeight <= 0) {
            maxByWeight = availableSlots;
        } else {
            double possible = (rack.getMax_weight() - currentLoad) / itemWeight;
            if (Double.isInfinite(possible) || Double.isNaN(possible) || possible <= 0) {
                maxByWeight = 0;
            } else {
                long possibleLong = (long) Math.floor(possible);
                if (possibleLong > Integer.MAX_VALUE) {
                    maxByWeight = Integer.MAX_VALUE;
                } else {
                    maxByWeight = (int) possibleLong;
                }
            }
        }

        if (maxByWeight <= 0 || availableSlots <= 0) {
            return null;
        }

        List<Coordinate> freeCoordinates = findFreeCoordinates(rack, assortments);
        int availableCount = Math.min(Math.min(availableSlots, maxByWeight), freeCoordinates.size());
        if (availableCount <= 0) {
            return null;
        }
        return new RackCapacity(rack, availableCount, freeCoordinates);
    }

    private List<Coordinate> findFreeCoordinates(Rack rack, List<Assortment> assortments) {
        validateRackDimensions(rack);
        Set<Coordinate> occupied = new HashSet<>();
        for (Assortment assortment : assortments) {
            if (assortment.getPositionX() == null || assortment.getPositionY() == null) {
                continue;
            }
            int x = assortment.getPositionX();
            int y = assortment.getPositionY();
            if (x >= 1 && x <= rack.getSize_x() && y >= 1 && y <= rack.getSize_y()) {
                occupied.add(new Coordinate(x, y));
            }
        }
        List<Coordinate> free = new ArrayList<>();
        for (int x = 1; x <= rack.getSize_x(); x++) {
            for (int y = 1; y <= rack.getSize_y(); y++) {
                Coordinate coord = new Coordinate(x, y);
                if (!occupied.contains(coord)) {
                    free.add(coord);
                }
            }
        }
        return free;
    }

    private void validateRackDimensions(Rack rack) {
        if (rack == null) {
            throw new IllegalArgumentException(InventoryError.PLACEMENT_INVALID.name());
        }
        if (rack.getSize_x() <= 0 || rack.getSize_y() <= 0) {
            throw new IllegalArgumentException(InventoryError.PLACEMENT_INVALID.name());
        }
        if (rack.getSize_x() > MAX_RACK_SIDE || rack.getSize_y() > MAX_RACK_SIDE) {
            throw new IllegalArgumentException(InventoryError.PLACEMENT_INVALID.name());
        }
        long area = (long) rack.getSize_x() * rack.getSize_y();
        if (area > MAX_RACK_AREA) {
            throw new IllegalArgumentException(InventoryError.PLACEMENT_INVALID.name());
        }
    }

    private int safeTotalSlots(Rack rack) {
        try {
            int total = Math.multiplyExact(rack.getSize_x(), rack.getSize_y());
            if (total > MAX_RACK_AREA) {
                throw new IllegalArgumentException(InventoryError.PLACEMENT_INVALID.name());
            }
            return total;
        } catch (ArithmeticException ex) {
            throw new IllegalArgumentException(InventoryError.PLACEMENT_INVALID.name(), ex);
        }
    }

    private Timestamp calculateExpiresAt(long expireAfterDays, Instant createdAt) {
        if (expireAfterDays < 0 || expireAfterDays > MAX_EXPIRE_DAYS) {
            throw new IllegalArgumentException(InventoryError.EXPIRE_AFTER_INVALID.name());
        }
        try {
            Instant expiresAt = createdAt.plus(expireAfterDays, ChronoUnit.DAYS);
            return Timestamp.from(expiresAt);
        } catch (DateTimeException ex) {
            throw new IllegalArgumentException(InventoryError.EXPIRE_AFTER_INVALID.name(), ex);
        }
    }

    /**
     * Rozwiązuje pojemność regału z uwzględnieniem rezerwacji.
     * WSZYSTKIE aktywne rezerwacje są wykluczane z dostępnych pozycji,
     * aby uniknąć duplikatów przy wielokrotnym wywołaniu /plan.
     */
    private RackCapacity resolveRackCapacityWithReservations(Rack rack, Item item, Long userId, Timestamp now) {
        validateRackDimensions(rack);
        if (!rackMatchesItem(rack, item)) {
            return null;
        }

        List<Assortment> assortments = assortmentRepository.findByRackId(rack.getId());

        // Pobierz WSZYSTKIE aktywne rezerwacje dla tego regału (włącznie z własnymi)
        // Dzięki temu unikamy duplikatów przy wielokrotnym wywołaniu /plan
        List<PositionReservation> allActiveReservations = reservationRepository
                .findActiveReservationsForRack(rack.getId(), now);

        // Oblicz aktualnie załadowaną wagę
        double currentLoad = assortments.stream()
                .map(Assortment::getItem)
                .mapToDouble(Item::getWeight)
                .sum();

        int totalSlots = safeTotalSlots(rack);
        int occupiedSlots = assortments.size();
        // Uwzględnij WSZYSTKIE rezerwacje jako zajęte sloty
        int reservedCount = allActiveReservations.size();
        int availableSlots = Math.max(0, totalSlots - occupiedSlots - reservedCount);
        double itemWeight = item.getWeight();

        // Oblicz ile itemów można dodać ze względu na limit wagi
        int maxByWeight;
        if (itemWeight <= 0) {
            maxByWeight = availableSlots;
        } else {
            double possible = (rack.getMax_weight() - currentLoad) / itemWeight;
            if (Double.isInfinite(possible) || Double.isNaN(possible) || possible <= 0) {
                maxByWeight = 0;
            } else {
                long possibleLong = (long) Math.floor(possible);
                maxByWeight = possibleLong > Integer.MAX_VALUE ? Integer.MAX_VALUE : (int) possibleLong;
            }
        }

        if (maxByWeight <= 0 || availableSlots <= 0) {
            log.debug("[CAPACITY] ✗ Rack #{} EXCLUDED | maxByWeight={} | availableSlots={}",
                    rack.getId(), maxByWeight, availableSlots);
            return null;
        }

        // Znajdź wolne koordynaty, wykluczając WSZYSTKIE zarezerwowane pozycje
        List<Coordinate> freeCoordinates = findFreeCoordinatesWithReservations(rack, assortments, allActiveReservations);
        int availableCount = Math.min(Math.min(availableSlots, maxByWeight), freeCoordinates.size());

        log.debug("[CAPACITY] Rack #{} | totalSlots={} | occupied={} | reserved={} | availableSlots={} | " +
                        "maxByWeight={} | freeCoords={} | FINAL={} | currentLoad={}kg | maxWeight={}kg",
                rack.getId(), totalSlots, occupiedSlots, reservedCount, availableSlots,
                maxByWeight, freeCoordinates.size(), availableCount, currentLoad, rack.getMax_weight());

        if (availableCount <= 0) {
            return null;
        }
        return new RackCapacity(rack, availableCount, freeCoordinates);
    }

    /**
     * Znajduje wolne koordynaty, wykluczając zajęte przez produkty i zarezerwowane przez innych.
     */
    private List<Coordinate> findFreeCoordinatesWithReservations(Rack rack, List<Assortment> assortments,
                                                                 List<PositionReservation> reservations) {
        validateRackDimensions(rack);
        Set<Coordinate> occupied = new HashSet<>();

        // Zajęte przez produkty
        for (Assortment assortment : assortments) {
            if (assortment.getPositionX() == null || assortment.getPositionY() == null) {
                continue;
            }
            int x = assortment.getPositionX();
            int y = assortment.getPositionY();
            if (x >= 1 && x <= rack.getSize_x() && y >= 1 && y <= rack.getSize_y()) {
                occupied.add(new Coordinate(x, y));
            }
        }

        // Zarezerwowane przez innych użytkowników
        for (PositionReservation reservation : reservations) {
            occupied.add(new Coordinate(reservation.getPositionX(), reservation.getPositionY()));
        }

        List<Coordinate> free = new ArrayList<>();
        for (int x = 1; x <= rack.getSize_x(); x++) {
            for (int y = 1; y <= rack.getSize_y(); y++) {
                Coordinate coord = new Coordinate(x, y);
                if (!occupied.contains(coord)) {
                    free.add(coord);
                }
            }
        }
        return free;
    }

    /**
     * Grupuje regały według bliskości (warehouse, strefa, alejka).
     * Sortuje w ramach grup według dostępnej pojemności.
     */
    private List<RackCapacity> groupRacksByProximity(List<RackCapacity> candidates) {
        Map<String, List<RackCapacity>> grouped = new LinkedHashMap<>();

        for (RackCapacity capacity : candidates) {
            Rack rack = capacity.rack();
            String marker = rack.getMarker() != null ? rack.getMarker() : "";
            String zone = marker.isEmpty() ? "Z" : String.valueOf(marker.charAt(0));
            String aisle = marker.length() > 1 ? marker.substring(1) : "";

            Long warehouseId = rack.getWarehouse() != null ? rack.getWarehouse().getId() : 0L;
            String groupKey = warehouseId + "_" + zone + "_" + aisle;

            grouped.computeIfAbsent(groupKey, k -> new ArrayList<>()).add(capacity);
        }

        List<RackCapacity> result = new ArrayList<>();
        for (List<RackCapacity> group : grouped.values()) {
            group.sort(Comparator
                    .comparingInt(RackCapacity::availableCount).reversed()
                    .thenComparing(rc -> rc.rack().getMarker(), Comparator.nullsLast(String::compareTo))
                    .thenComparing(rc -> rc.rack().getId()));
            result.addAll(group);
        }

        return result;
    }

    /**
     * Grupuje koordynaty według bliskości - wypełnianie "wąż".
     * Sortuje po Y (rząd), potem po X (pozycja w rzędzie).
     */
    private List<Coordinate> groupCoordinatesByProximity(List<Coordinate> coordinates) {
        if (coordinates.isEmpty()) {
            return coordinates;
        }

        List<Coordinate> sorted = new ArrayList<>(coordinates);
        sorted.sort(Comparator
                .comparingInt(Coordinate::y)
                .thenComparing(Coordinate::x));

        return sorted;
    }

    public record PlacementPlanResult(boolean success, InventoryError code, PlacementPlanResponse response) {
        public static PlacementPlanResult noMatch(InventoryError code) {
            return new PlacementPlanResult(false, code, null);
        }

        public static PlacementPlanResult full(PlacementPlanResponse response) {
            return new PlacementPlanResult(true, null, response);
        }
    }

    private record Coordinate(int x, int y) {
    }

    private record RackCapacity(Rack rack, int availableCount, List<Coordinate> freeCoordinates) {
    }
}
