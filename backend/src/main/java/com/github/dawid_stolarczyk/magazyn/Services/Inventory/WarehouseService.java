package com.github.dawid_stolarczyk.magazyn.Services.Inventory;

import com.github.dawid_stolarczyk.magazyn.Common.Enums.InventoryError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.WarehouseDto;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Warehouse;
import com.github.dawid_stolarczyk.magazyn.Repositories.AssortmentRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.WarehouseRepository;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.RateLimitOperation;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

import static com.github.dawid_stolarczyk.magazyn.Utils.InternetUtils.getClientIp;

@Service
@RequiredArgsConstructor
public class WarehouseService {
    private final WarehouseRepository warehouseRepository;
    private final AssortmentRepository assortmentRepository;
    private final Bucket4jRateLimiter rateLimiter;

    public List<WarehouseDto> getAllWarehouses(HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);
        return warehouseRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public Page<WarehouseDto> getAllWarehousesPaged(HttpServletRequest request, Pageable pageable) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);
        return warehouseRepository.findAll(pageable)
                .map(this::mapToDto);
    }

    public WarehouseDto getWarehouseById(Long id, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_READ);
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.WAREHOUSE_NOT_FOUND.name()));
        return mapToDto(warehouse);
    }

    @Transactional
    public WarehouseDto createWarehouse(WarehouseDto dto, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_WRITE);
        return createWarehouseInternal(dto);
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
    public WarehouseDto updateWarehouse(Long id, WarehouseDto dto, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_WRITE);
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.WAREHOUSE_NOT_FOUND.name()));
        warehouse.setName(dto.getName());
        return mapToDto(warehouseRepository.save(warehouse));
    }

    @Transactional
    public void deleteWarehouse(Long id, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.INVENTORY_WRITE);
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.WAREHOUSE_NOT_FOUND.name()));
        warehouseRepository.delete(warehouse);
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
                .build();
    }
}
