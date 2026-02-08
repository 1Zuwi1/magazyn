package com.github.dawid_stolarczyk.magazyn.Services.Inventory;

import com.github.dawid_stolarczyk.magazyn.Common.Enums.InventoryError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.*;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Rack;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Warehouse;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.AssortmentRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.RackRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.WarehouseRepository;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.RateLimitOperation;
import com.github.dawid_stolarczyk.magazyn.Utils.StringUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static com.github.dawid_stolarczyk.magazyn.Utils.InternetUtils.getClientIp;

@Service
@RequiredArgsConstructor
public class RackService {
    private final RackRepository rackRepository;
    private final WarehouseRepository warehouseRepository;
    private final AssortmentRepository assortmentRepository;
    private final Bucket4jRateLimiter rateLimiter;

    public RackPagedResponse getAllRacksPaged(HttpServletRequest request, Pageable pageable) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);
        RackSummaryDto summary = calculateRackSummary(null);
        return RackPagedResponse.from(rackRepository.findAll(pageable).map(this::mapToDto), summary);
    }

    public RackPagedResponse getRacksByWarehousePaged(Long warehouseId, HttpServletRequest request, Pageable pageable) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);
        if (!warehouseRepository.existsById(warehouseId)) {
            throw new IllegalArgumentException(InventoryError.WAREHOUSE_NOT_FOUND.name());
        }
        return RackPagedResponse.from(rackRepository.findByWarehouseId(warehouseId, pageable)
                .map(this::mapToDto), calculateRackSummary(warehouseId));
    }

    public RackDto getRackById(Long id, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);
        Rack rack = rackRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.RACK_NOT_FOUND.name()));
        return mapToDto(rack);
    }

    @Transactional
    public RackDto createRack(RackCreateRequest request, HttpServletRequest httpRequest) {
        rateLimiter.consumeOrThrow(getClientIp(httpRequest), RateLimitOperation.INVENTORY_WRITE);

        validateRackRequest(request.getMinTemp(), request.getMaxTemp(), request.getSizeX(), request.getSizeY());
        Warehouse warehouse = warehouseRepository.findById(request.getWarehouseId())
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.WAREHOUSE_NOT_FOUND.name()));

        // Normalize marker before checking for duplicates
        String normalizedMarker = StringUtils.normalizeRackMarker(request.getMarker());

        // Check for duplicate marker in the same warehouse
        if (rackRepository.existsByWarehouseIdAndMarker(request.getWarehouseId(), normalizedMarker)) {
            throw new IllegalArgumentException("RACK_MARKER_DUPLICATE: Marker '" + normalizedMarker + "' already exists in warehouse " + request.getWarehouseId());
        }

        Rack rack = new Rack();
        updateRackFromRequest(rack, request);
        rack.setWarehouse(warehouse);

        return mapToDto(rackRepository.save(rack));
    }

    /**
     * Internal method for bulk import - no rate limiting
     */
    @Transactional
    public RackDto createRackInternal(RackDto rackDto) {
        validateRackDto(rackDto);
        Warehouse warehouse = warehouseRepository.findById(rackDto.getWarehouseId())
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.WAREHOUSE_NOT_FOUND.name()));

        // Normalize marker before checking for duplicates
        String normalizedMarker = StringUtils.normalizeRackMarker(rackDto.getMarker());

        // Check for duplicate marker in the same warehouse
        if (rackRepository.existsByWarehouseIdAndMarker(rackDto.getWarehouseId(), normalizedMarker)) {
            throw new IllegalArgumentException("RACK_MARKER_DUPLICATE: Marker '" + normalizedMarker + "' already exists in warehouse " + rackDto.getWarehouseId());
        }

        Rack rack = new Rack();
        updateRackFromDto(rack, rackDto);
        rack.setWarehouse(warehouse);

        return mapToDto(rackRepository.save(rack));
    }

    @Transactional
    public RackDto updateRack(Long id, RackUpdateRequest request, HttpServletRequest httpRequest) {
        rateLimiter.consumeOrThrow(getClientIp(httpRequest), RateLimitOperation.INVENTORY_WRITE);

        validateRackRequest(request.getMinTemp(), request.getMaxTemp(), request.getSizeX(), request.getSizeY());
        Rack rack = rackRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.RACK_NOT_FOUND.name()));

        Warehouse warehouse = warehouseRepository.findById(request.getWarehouseId())
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.WAREHOUSE_NOT_FOUND.name()));

        // Normalize marker before checking for duplicates
        String normalizedMarker = StringUtils.normalizeRackMarker(request.getMarker());

        // Check for duplicate marker in the same warehouse (excluding current rack)
        rackRepository.findByWarehouseIdAndMarker(request.getWarehouseId(), normalizedMarker)
                .ifPresent(existingRack -> {
                    if (!existingRack.getId().equals(id)) {
                        throw new IllegalArgumentException("RACK_MARKER_DUPLICATE: Marker '" + normalizedMarker + "' already exists in warehouse " + request.getWarehouseId());
                    }
                });

        // Prevent disabling acceptsDangerous if rack contains dangerous items
        if (rack.isAcceptsDangerous() && !request.isAcceptsDangerous()) {
            boolean hasDangerousItems = rack.getAssortments().stream()
                    .anyMatch(assortment -> assortment.getItem().isDangerous());
            if (hasDangerousItems) {
                throw new IllegalArgumentException(InventoryError.RACK_HAS_DANGEROUS_ITEMS.name());
            }
        }

        updateRackFromRequest(rack, request);
        rack.setWarehouse(warehouse);

        return mapToDto(rackRepository.save(rack));
    }

    @Transactional
    public void deleteRack(Long id, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_WRITE);
        Rack rack = rackRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.RACK_NOT_FOUND.name()));
        rackRepository.delete(rack);
    }

    private void validateRackDto(RackDto dto) {
        if (dto.getMinTemp() > dto.getMaxTemp()) {
            throw new IllegalArgumentException("INVALID_TEMPERATURE_RANGE");
        }
        if (dto.getSizeX() <= 0 || dto.getSizeY() <= 0) {
            throw new IllegalArgumentException("INVALID_DIMENSIONS");
        }
    }

    private void validateRackRequest(float minTemp, float maxTemp, int sizeX, int sizeY) {
        if (minTemp > maxTemp) {
            throw new IllegalArgumentException("INVALID_TEMPERATURE_RANGE");
        }
        if (sizeX <= 0 || sizeY <= 0) {
            throw new IllegalArgumentException("INVALID_DIMENSIONS");
        }
    }

    private void updateRackFromDto(Rack rack, RackDto dto) {
        // Normalize marker to ensure consistent formatting
        rack.setMarker(StringUtils.normalizeRackMarker(dto.getMarker()));
        rack.setComment(dto.getComment());
        rack.setSize_x(dto.getSizeX());
        rack.setSize_y(dto.getSizeY());
        rack.setMax_temp(dto.getMaxTemp());
        rack.setMin_temp(dto.getMinTemp());
        rack.setMax_weight(dto.getMaxWeight());
        rack.setMax_size_x(dto.getMaxSizeX());
        rack.setMax_size_y(dto.getMaxSizeY());
        rack.setMax_size_z(dto.getMaxSizeZ());
        rack.setAcceptsDangerous(dto.isAcceptsDangerous());
    }

    private void updateRackFromRequest(Rack rack, RackCreateRequest request) {
        rack.setMarker(StringUtils.normalizeRackMarker(request.getMarker()));
        rack.setComment(request.getComment());
        rack.setSize_x(request.getSizeX());
        rack.setSize_y(request.getSizeY());
        rack.setMax_temp(request.getMaxTemp());
        rack.setMin_temp(request.getMinTemp());
        rack.setMax_weight(request.getMaxWeight());
        rack.setMax_size_x(request.getMaxSizeX());
        rack.setMax_size_y(request.getMaxSizeY());
        rack.setMax_size_z(request.getMaxSizeZ());
        rack.setAcceptsDangerous(request.isAcceptsDangerous());
    }

    private void updateRackFromRequest(Rack rack, RackUpdateRequest request) {
        rack.setMarker(StringUtils.normalizeRackMarker(request.getMarker()));
        rack.setComment(request.getComment());
        rack.setSize_x(request.getSizeX());
        rack.setSize_y(request.getSizeY());
        rack.setMax_temp(request.getMaxTemp());
        rack.setMin_temp(request.getMinTemp());
        rack.setMax_weight(request.getMaxWeight());
        rack.setMax_size_x(request.getMaxSizeX());
        rack.setMax_size_y(request.getMaxSizeY());
        rack.setMax_size_z(request.getMaxSizeZ());
        rack.setAcceptsDangerous(request.isAcceptsDangerous());
    }

    private RackDto mapToDto(Rack rack) {
        int occupiedSlots = rack.getAssortments().size();
        int totalSlots = rack.getSize_x() * rack.getSize_y();
        int freeSlots = totalSlots - occupiedSlots;
        float totalWeight = (float) rack.getAssortments().stream()
                .mapToDouble(assortment -> assortment.getItem().getWeight())
                .sum();


        return RackDto.builder()
                .id(rack.getId())
                .marker(rack.getMarker())
                .warehouseId(rack.getWarehouse() != null ? rack.getWarehouse().getId() : null)
                .comment(rack.getComment())
                .sizeX(rack.getSize_x())
                .sizeY(rack.getSize_y())
                .maxTemp(rack.getMax_temp())
                .minTemp(rack.getMin_temp())
                .maxWeight(rack.getMax_weight())
                .maxSizeX(rack.getMax_size_x())
                .maxSizeY(rack.getMax_size_y())
                .maxSizeZ(rack.getMax_size_z())
                .acceptsDangerous(rack.isAcceptsDangerous())
                .occupiedSlots(occupiedSlots)
                .freeSlots(freeSlots)
                .totalSlots(totalSlots)
                .totalWeight(totalWeight)
                .build();
    }

    private RackSummaryDto calculateRackSummary(Long warehouseId) {
        List<Rack> racks;
        if (warehouseId == null) {
            racks = rackRepository.findAll();
        } else {
            racks = rackRepository.findByWarehouseId(warehouseId);
        }

        int totalCapacity = 0;
        int totalOccupiedSlots = 0;
        float totalWeight = 0;

        for (Rack rack : racks) {
            totalCapacity += rack.getSize_x() * rack.getSize_y();

            long rackOccupied = assortmentRepository.countByRackId(rack.getId());
            totalOccupiedSlots += Long.valueOf(rackOccupied).intValue();

            totalWeight += (float) rack.getAssortments().stream()
                    .mapToDouble(assortment -> assortment.getItem().getWeight())
                    .sum();
        }

        int totalFreeSlots = totalCapacity - totalOccupiedSlots;

        return RackSummaryDto.builder()
                .totalCapacity(totalCapacity)
                .freeSlots(totalFreeSlots)
                .occupiedSlots(totalOccupiedSlots)
                .totalRacks(racks.size())
                .totalWeight(totalWeight)
                .build();
    }
}
