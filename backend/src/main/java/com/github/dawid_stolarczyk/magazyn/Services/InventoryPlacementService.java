package com.github.dawid_stolarczyk.magazyn.Services;

import com.github.dawid_stolarczyk.magazyn.Common.Enums.InventoryError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.*;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Assortment;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Item;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Rack;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Repositories.AssortmentRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.ItemRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.RackRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.UserRepository;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.AuthUtil;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.DateTimeException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class InventoryPlacementService {
    private static final int MAX_EXPIRE_DAYS = 3650;
    private static final int MAX_RACK_SIDE = 1000;
    private static final int MAX_RACK_AREA = 1_000_000;
    private static final double EPS = 1e-6;

    private final ItemRepository itemRepository;
    private final RackRepository rackRepository;
    private final AssortmentRepository assortmentRepository;
    private final UserRepository userRepository;

    public InventoryPlacementService(
            ItemRepository itemRepository,
            RackRepository rackRepository,
            AssortmentRepository assortmentRepository,
            UserRepository userRepository) {
        this.itemRepository = itemRepository;
        this.rackRepository = rackRepository;
        this.assortmentRepository = assortmentRepository;
        this.userRepository = userRepository;
    }

    public PlacementPlanResult buildPlacementPlan(PlacementPlanRequest request) {
        Item item = itemRepository.findById(request.getItemId())
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.ITEM_NOT_FOUND.name()));
        List<Rack> racks = request.getWarehouseId() == null
                ? rackRepository.findAll()
                : rackRepository.findByWarehouseId(request.getWarehouseId());
        List<RackCapacity> candidates = new ArrayList<>();

        for (Rack rack : racks) {
            RackCapacity capacity = resolveRackCapacity(rack, item);
            if (capacity != null) {
                candidates.add(capacity);
            }
        }

        if (candidates.isEmpty()) {
            return PlacementPlanResult.noMatch(InventoryError.NO_REGALS_MATCH);
        }

        candidates.sort(Comparator
                .comparingInt(RackCapacity::availableCount).reversed()
                .thenComparing(rackCapacity -> rackCapacity.rack().getMarker(),
                        Comparator.nullsLast(String::compareTo))
                .thenComparing(rackCapacity -> rackCapacity.rack().getId()));

        int remaining = request.getQuantity();
        List<PlacementSlotResponse> placements = new ArrayList<>();
        for (RackCapacity capacity : candidates) {
            if (remaining <= 0) {
                break;
            }
            int allocate = Math.min(remaining, capacity.availableCount());
            for (int i = 0; i < allocate; i++) {
                Coordinate coordinate = capacity.freeCoordinates().get(i);
                PlacementSlotResponse slot = new PlacementSlotResponse();
                slot.setRackId(capacity.rack().getId());
                slot.setRackMarker(capacity.rack().getMarker());
                slot.setPositionX(coordinate.x());
                slot.setPositionY(coordinate.y());
                placements.add(slot);
            }
            remaining -= allocate;
        }

        PlacementPlanResponse response = new PlacementPlanResponse();
        response.setItemId(item.getId());
        response.setRequestedQuantity(request.getQuantity());
        response.setAllocatedQuantity(request.getQuantity() - remaining);
        response.setRemainingQuantity(remaining);
        response.setPlacements(placements);

        if (response.getAllocatedQuantity() == 0) {
            return PlacementPlanResult.noMatch(InventoryError.NO_REGALS_MATCH);
        }

        if (remaining > 0) {
            throw new IllegalArgumentException(InventoryError.INSUFFICIENT_SPACE.name());
        }

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
    public PlacementConfirmationResponse confirmPlacement(PlacementConfirmationRequest request) {
        Item item = itemRepository.findById(request.getItemId())
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.ITEM_NOT_FOUND.name()));
        User user = userRepository.findById(AuthUtil.getCurrentAuthPrincipal().getUserId())
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.USER_NOT_FOUND.name()));

        Map<Long, List<PlacementSlotRequest>> placementsByRack = new HashMap<>();
        for (PlacementSlotRequest slot : request.getPlacements()) {
            placementsByRack.computeIfAbsent(slot.getRackId(), ignored -> new ArrayList<>()).add(slot);
        }

        List<Assortment> newAssortments = new ArrayList<>();
        Timestamp createdAt = Timestamp.from(Instant.now());
        Timestamp expiresAt = calculateExpiresAt(item.getExpireAfterDays(), createdAt.toInstant());

        for (Map.Entry<Long, List<PlacementSlotRequest>> entry : placementsByRack.entrySet()) {
            Rack rack = rackRepository.findById(entry.getKey())
                    .orElseThrow(() -> new IllegalArgumentException(InventoryError.PLACEMENT_INVALID.name()));
            validateRackDimensions(rack);
            if (!rackMatchesItem(rack, item)) {
                throw new IllegalArgumentException(InventoryError.PLACEMENT_INVALID.name());
            }
            List<Assortment> existingAssortments = assortmentRepository.findByRackId(rack.getId());
            RackCapacity capacity = resolveRackCapacity(rack, item, existingAssortments);
            int neededSlots = entry.getValue().size();
            if (capacity == null || neededSlots > capacity.availableCount()) {
                throw new IllegalArgumentException(InventoryError.PLACEMENT_INVALID.name());
            }
            Set<Coordinate> occupied = new HashSet<>();
            for (Assortment assortment : existingAssortments) {
                if (assortment.getPosition_x() != null && assortment.getPosition_y() != null) {
                    occupied.add(new Coordinate(assortment.getPosition_x(), assortment.getPosition_y()));
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
                Assortment assortment = new Assortment();
                assortment.setItem(item);
                assortment.setRack(rack);
                assortment.setUser(user);
                assortment.setCreated_at(createdAt);
                assortment.setExpires_at(expiresAt);
                assortment.setPosition_x(slot.getPositionX());
                assortment.setPosition_y(slot.getPositionY());
                newAssortments.add(assortment);
            }
        }

        try {
            assortmentRepository.saveAll(newAssortments);
        } catch (DataIntegrityViolationException ex) {
            // jeśli wystąpi konflikt z powodu równoległego wstawienia tej samej pozycji
            throw new IllegalArgumentException(InventoryError.PLACEMENT_INVALID.name());
        }

        PlacementConfirmationResponse response = new PlacementConfirmationResponse();
        response.setItemId(item.getId());
        response.setStoredQuantity(newAssortments.size());
        return response;
    }

    private boolean rackMatchesItem(Rack rack, Item item) {
        Objects.requireNonNull(rack, "rack");
        Objects.requireNonNull(item, "item");

        if (item.isDangerous() && !rack.isAcceptsDangerous()) {
            return false;
        }

        return rack.getMin_temp() <= item.getMin_temp()
                && rack.getMax_temp() >= item.getMax_temp()
                && lessOrEqualWithEps(item.getSize_x(), rack.getMax_size_x())
                && lessOrEqualWithEps(item.getSize_y(), rack.getMax_size_y())
                && lessOrEqualWithEps(item.getSize_z(), rack.getMax_size_z());
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
        double currentLoad = assortments.stream()
                .map(Assortment::getItem)
                .mapToDouble(Item::getWeight)
                .sum();
        int totalSlots = safeTotalSlots(rack);
        int occupiedSlots = assortments.size();
        int availableSlots = Math.max(0, totalSlots - occupiedSlots);
        double itemWeight = item.getWeight();

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
            if (assortment.getPosition_x() == null || assortment.getPosition_y() == null) {
                continue;
            }
            int x = assortment.getPosition_x();
            int y = assortment.getPosition_y();
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
