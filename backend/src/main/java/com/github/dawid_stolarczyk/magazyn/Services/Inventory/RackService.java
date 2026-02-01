package com.github.dawid_stolarczyk.magazyn.Services.Inventory;

import com.github.dawid_stolarczyk.magazyn.Common.Enums.InventoryError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.RackDto;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Rack;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Warehouse;
import com.github.dawid_stolarczyk.magazyn.Repositories.RackRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RackService {
    private final RackRepository rackRepository;
    private final WarehouseRepository warehouseRepository;

    public List<RackDto> getAllRacks() {
        return rackRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<RackDto> getRacksByWarehouse(Long warehouseId) {
        if (!warehouseRepository.existsById(warehouseId)) {
            throw new IllegalArgumentException(InventoryError.WAREHOUSE_NOT_FOUND.name());
        }
        return rackRepository.findByWarehouseId(warehouseId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public RackDto getRackById(Long id) {
        Rack rack = rackRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.RACK_NOT_FOUND.name()));
        return mapToDto(rack);
    }

    @Transactional
    public RackDto createRack(RackDto rackDto) {
        validateRackDto(rackDto);
        Warehouse warehouse = warehouseRepository.findById(rackDto.getWarehouseId())
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.WAREHOUSE_NOT_FOUND.name()));

        Rack rack = new Rack();
        updateRackFromDto(rack, rackDto);
        rack.setWarehouse(warehouse);

        return mapToDto(rackRepository.save(rack));
    }

    @Transactional
    public RackDto updateRack(Long id, RackDto rackDto) {
        validateRackDto(rackDto);
        Rack rack = rackRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.RACK_NOT_FOUND.name()));

        Warehouse warehouse = warehouseRepository.findById(rackDto.getWarehouseId())
                .orElseThrow(() -> new IllegalArgumentException(InventoryError.WAREHOUSE_NOT_FOUND.name()));

        updateRackFromDto(rack, rackDto);
        rack.setWarehouse(warehouse);

        return mapToDto(rackRepository.save(rack));
    }

    @Transactional
    public void deleteRack(Long id) {
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

    private void updateRackFromDto(Rack rack, RackDto dto) {
        rack.setMarker(dto.getMarker());
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

    private RackDto mapToDto(Rack rack) {
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
                .build();
    }
}
