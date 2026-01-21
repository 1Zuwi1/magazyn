package com.github.dawid_stolarczyk.magazyn.Services;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.PlacementConfirmationRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.PlacementConfirmationResponse;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.PlacementPlanRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.PlacementPlanResponse;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.PlacementSlotRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.PlacementSlotResponse;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Assortment;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Item;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Rack;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Repositories.AssortmentRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.ItemRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.RackRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.UserRepository;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.AuthUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class InventoryPlacementService {
    private static final String ITEM_NOT_FOUND = "ITEM_NOT_FOUND";
    private static final String USER_NOT_FOUND = "USER_NOT_FOUND";
    private static final String PLACEMENT_INVALID = "PLACEMENT_INVALID";
    private static final String NO_REGALS_MATCH = "NO_REGALS_MATCH";
    private static final String INSUFFICIENT_SPACE = "INSUFFICIENT_SPACE";

    @Autowired
    private ItemRepository itemRepository;
    @Autowired
    private RackRepository rackRepository;
    @Autowired
    private AssortmentRepository assortmentRepository;
    @Autowired
    private UserRepository userRepository;

    public PlacementPlanResult buildPlacementPlan(PlacementPlanRequest request) {
        Item item = itemRepository.findById(request.getItemId())
                .orElseThrow(() -> new IllegalArgumentException(ITEM_NOT_FOUND));
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
            return PlacementPlanResult.noMatch(NO_REGALS_MATCH);
        }

        candidates.sort(Comparator
                .comparingInt(RackCapacity::availableCount).reversed()
                .thenComparing(rackCapacity -> rackCapacity.rack().getMarker() == null ? "" : rackCapacity.rack().getMarker())
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

        if (placements.isEmpty()) {
            return PlacementPlanResult.noMatch(NO_REGALS_MATCH);
        }

        if (remaining > 0) {
            throw new IllegalArgumentException(INSUFFICIENT_SPACE);
        }

        return PlacementPlanResult.full(response);
    }

    public PlacementConfirmationResponse confirmPlacement(PlacementConfirmationRequest request) {
        Item item = itemRepository.findById(request.getItemId())
                .orElseThrow(() -> new IllegalArgumentException(ITEM_NOT_FOUND));
        User user = userRepository.findById(AuthUtil.getCurrentAuthPrincipal().getUserId())
                .orElseThrow(() -> new IllegalArgumentException(USER_NOT_FOUND));

        Map<Long, List<PlacementSlotRequest>> placementsByRack = new HashMap<>();
        for (PlacementSlotRequest slot : request.getPlacements()) {
            placementsByRack.computeIfAbsent(slot.getRackId(), ignored -> new ArrayList<>()).add(slot);
        }

        List<Assortment> newAssortments = new ArrayList<>();
        Timestamp createdAt = new Timestamp(System.currentTimeMillis());
        Timestamp expiresAt = new Timestamp(createdAt.getTime() + Duration.ofDays(item.getExpireAfter()).toMillis());

        for (Map.Entry<Long, List<PlacementSlotRequest>> entry : placementsByRack.entrySet()) {
            Rack rack = rackRepository.findById(entry.getKey())
                    .orElseThrow(() -> new IllegalArgumentException(PLACEMENT_INVALID));
            if (!rackMatchesItem(rack, item)) {
                throw new IllegalArgumentException(PLACEMENT_INVALID);
            }
            List<Assortment> existingAssortments = assortmentRepository.findByRackId(rack.getId());
            RackCapacity capacity = resolveRackCapacity(rack, item, existingAssortments);
            int neededSlots = entry.getValue().size();
            if (capacity == null || neededSlots > capacity.availableCount()) {
                throw new IllegalArgumentException(PLACEMENT_INVALID);
            }
            Set<String> occupied = new HashSet<>();
            for (Assortment assortment : existingAssortments) {
                if (assortment.getPosition_x() != null && assortment.getPosition_y() != null) {
                    occupied.add(assortment.getPosition_x() + ":" + assortment.getPosition_y());
                }
            }
            Set<String> usedInRequest = new HashSet<>();
            for (PlacementSlotRequest slot : entry.getValue()) {
                if (slot.getPositionX() < 1 || slot.getPositionX() > rack.getSize_x()
                        || slot.getPositionY() < 1 || slot.getPositionY() > rack.getSize_y()) {
                    throw new IllegalArgumentException(PLACEMENT_INVALID);
                }
                String key = slot.getPositionX() + ":" + slot.getPositionY();
                if (occupied.contains(key) || !usedInRequest.add(key)) {
                    throw new IllegalArgumentException(PLACEMENT_INVALID);
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

        assortmentRepository.saveAll(newAssortments);

        PlacementConfirmationResponse response = new PlacementConfirmationResponse();
        response.setItemId(item.getId());
        response.setStoredQuantity(newAssortments.size());
        return response;
    }

    private boolean rackMatchesItem(Rack rack, Item item) {
        return rack.getMin_temp() <= item.getMin_temp()
                && rack.getMax_temp() >= item.getMax_temp()
                && item.getSize_x() <= rack.getMax_size_x()
                && item.getSize_y() <= rack.getMax_size_y()
                && item.getSize_z() <= rack.getMax_size_z();
    }

    private RackCapacity resolveRackCapacity(Rack rack, Item item) {
        List<Assortment> assortments = assortmentRepository.findByRackId(rack.getId());
        return resolveRackCapacity(rack, item, assortments);
    }

    private RackCapacity resolveRackCapacity(Rack rack, Item item, List<Assortment> assortments) {
        if (!rackMatchesItem(rack, item)) {
            return null;
        }
        float currentLoad = assortments.stream()
                .map(Assortment::getItem)
                .map(Item::getWeight)
                .reduce(0.0f, Float::sum);
        int totalSlots = rack.getSize_x() * rack.getSize_y();
        int occupiedSlots = assortments.size();
        int availableSlots = Math.max(0, totalSlots - occupiedSlots);
        int maxByWeight = item.getWeight() <= 0
                ? availableSlots
                : (int) Math.floor((rack.getMax_weight() - currentLoad) / item.getWeight());
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
        boolean[][] occupied = new boolean[rack.getSize_x()][rack.getSize_y()];
        for (Assortment assortment : assortments) {
            if (assortment.getPosition_x() == null || assortment.getPosition_y() == null) {
                continue;
            }
            int xIndex = assortment.getPosition_x() - 1;
            int yIndex = assortment.getPosition_y() - 1;
            if (xIndex >= 0 && xIndex < rack.getSize_x() && yIndex >= 0 && yIndex < rack.getSize_y()) {
                occupied[xIndex][yIndex] = true;
            }
        }
        List<Coordinate> free = new ArrayList<>();
        for (int x = 0; x < rack.getSize_x(); x++) {
            for (int y = 0; y < rack.getSize_y(); y++) {
                if (!occupied[x][y]) {
                    free.add(new Coordinate(x + 1, y + 1));
                }
            }
        }
        return free;
    }

    public record PlacementPlanResult(boolean success, String code, PlacementPlanResponse response) {
        public static PlacementPlanResult noMatch(String code) {
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
