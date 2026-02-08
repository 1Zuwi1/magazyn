package com.github.dawid_stolarczyk.magazyn.Services.Inventory;

import com.github.dawid_stolarczyk.magazyn.Common.Enums.InventoryError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.*;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Warehouse;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.AssortmentRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.WarehouseRepository;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.RateLimitOperation;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.github.dawid_stolarczyk.magazyn.Utils.InternetUtils.getClientIp;

@Service
@RequiredArgsConstructor
public class WarehouseService {
    private final WarehouseRepository warehouseRepository;
    private final AssortmentRepository assortmentRepository;
    private final Bucket4jRateLimiter rateLimiter;

    public WarehousePagedResponse getAllWarehousesPaged(HttpServletRequest request, Pageable pageable, String nameFilter, Integer minPercentOfOccupiedSlots, boolean onlyNonEmpty) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);

        Page<WarehouseDto> warehousePage;
        if (nameFilter != null && !nameFilter.isEmpty()) {
            warehousePage = warehouseRepository.findByNameContaining(nameFilter, pageable)
                    .map(this::mapToDto);
        } else {
            warehousePage = warehouseRepository.findAll(pageable)
                    .map(this::mapToDto);
        }

        if (minPercentOfOccupiedSlots != null) {
            warehousePage = new PageImpl<>(
                    warehousePage.getContent().stream()
                            .filter(dto -> {
                                if (dto.getTotalSlots() == 0) return false;
                                int occupiedSlotsPercentage = (int) ((double) dto.getOccupiedSlots() / dto.getTotalSlots() * 100);
                                return occupiedSlotsPercentage <= minPercentOfOccupiedSlots;
                            }).toList(),
                    pageable,
                    warehousePage.getTotalElements()
            );
        }

        if (onlyNonEmpty) {
            warehousePage = new PageImpl<>(
                    warehousePage.getContent().stream()
                            .filter(dto -> dto.getOccupiedSlots() > 0)
                            .toList(),
                    pageable,
                    warehousePage.getTotalElements()
            );
        }

        // Calculate cumulative summary across ALL warehouses (not just current page)
        WarehouseSummaryDto summary = calculateWarehouseSummary();

        return WarehousePagedResponse.from(warehousePage, summary);
    }

    public WarehouseDto getWarehouseById(Long id, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.WAREHOUSE_NOT_FOUND.name()));
        return mapToDto(warehouse);
    }

    @Transactional
    public WarehouseDto createWarehouse(WarehouseCreateRequest request, HttpServletRequest httpRequest) {
        rateLimiter.consumeOrThrow(getClientIp(httpRequest), RateLimitOperation.INVENTORY_WRITE);
        Warehouse warehouse = new Warehouse();
        warehouse.setName(request.getName());
        return mapToDto(warehouseRepository.save(warehouse));
    }

    /**
     * Internal method for bulk import - no rate limiting
     */
    @Transactional
    public WarehouseDto createWarehouseInternal(WarehouseDto dto) {
        Warehouse warehouse = new Warehouse();
        warehouse.setName(dto.getName());
        return mapToDto(warehouseRepository.save(warehouse));
    }

    @Transactional
    public WarehouseDto updateWarehouse(Long id, WarehouseUpdateRequest request, HttpServletRequest httpRequest) {
        rateLimiter.consumeOrThrow(getClientIp(httpRequest), RateLimitOperation.INVENTORY_WRITE);
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.WAREHOUSE_NOT_FOUND.name()));
        warehouse.setName(request.getName());
        return mapToDto(warehouseRepository.save(warehouse));
    }

    @Transactional
    public void deleteWarehouse(Long id, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_WRITE);
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.WAREHOUSE_NOT_FOUND.name()));
        warehouseRepository.delete(warehouse);
    }

    private WarehouseSummaryDto calculateWarehouseSummary() {
        // Get all warehouses to calculate cumulative statistics
        var allWarehouses = warehouseRepository.findAll();

        int totalCapacity = 0;
        int totalOccupiedSlots = 0;
        int totalRacks = 0;

        for (Warehouse warehouse : allWarehouses) {
            // Calculate total capacity from all racks
            int warehouseCapacity = warehouse.getRacks().stream()
                    .mapToInt(rack -> rack.getSize_x() * rack.getSize_y())
                    .sum();
            totalCapacity += warehouseCapacity;

            // Count occupied slots (assortments)
            long warehouseOccupied = assortmentRepository.countByRack_WarehouseId(warehouse.getId());
            totalOccupiedSlots += warehouseOccupied;

            // Count racks
            totalRacks += warehouse.getRacks().size();
        }

        int totalFreeSlots = totalCapacity - totalOccupiedSlots;

        return WarehouseSummaryDto.builder()
                .totalCapacity(totalCapacity)
                .freeSlots(totalFreeSlots)
                .occupiedSlots(totalOccupiedSlots)
                .totalWarehouses((int) allWarehouses.size())
                .totalRacks(totalRacks)
                .build();
    }

    private WarehouseDto mapToDto(Warehouse warehouse) {
        // Liczba regałów w magazynie
        int racksCount = warehouse.getRacks().size();

        // Liczba zajętych miejsc (Assortments)
        long occupiedSlots = assortmentRepository.countByRack_WarehouseId(warehouse.getId());

        // Całkowita liczba miejsc we wszystkich regałach
        int totalSlots = warehouse.getRacks().stream()
                .mapToInt(rack -> rack.getSize_x() * rack.getSize_y())
                .sum();

        // Liczba wolnych miejsc
        int freeSlots = totalSlots - (int) occupiedSlots;

        return WarehouseDto.builder()
                .id(warehouse.getId())
                .name(warehouse.getName())
                .racksCount(racksCount)
                .occupiedSlots((int) occupiedSlots)
                .freeSlots(freeSlots)
                .totalSlots(totalSlots)
                .build();
    }
}
