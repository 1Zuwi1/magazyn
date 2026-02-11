package com.github.dawid_stolarczyk.magazyn.Services.ImportExport;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.*;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class WarehouseExportService {

    private final ItemRepository itemRepository;
    private final WarehouseRepository warehouseRepository;
    private final RackRepository rackRepository;
    private final AssortmentRepository assortmentRepository;

    public String exportAllWarehouses() {
        List<Warehouse> warehouses = warehouseRepository.findAll();
        StringBuilder sb = new StringBuilder();
        sb.append("name\n");
        for (Warehouse w : warehouses) {
            sb.append(escapeCsv(w.getName())).append("\n");
        }
        return sb.toString();
    }

    public String exportWarehouseById(Long warehouseId) {
        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new IllegalArgumentException("WAREHOUSE_NOT_FOUND"));
        return "name\n" + escapeCsv(warehouse.getName()) + "\n";
    }

    public String exportAllItems() {
        List<Item> items = itemRepository.findAll();
        return exportItemsToCsv(items);
    }

    public String exportItemsByWarehouseId(Long warehouseId) {
        List<Item> items = itemRepository.findDistinctByWarehouseId(warehouseId);
        return exportItemsToCsv(items);
    }

    private String exportItemsToCsv(List<Item> items) {
        StringBuilder sb = new StringBuilder();
        for (Item item : items) {
            sb.append(escapeCsv(item.getName())).append(";");
            sb.append(escapeCsv(item.getCode() != null ? item.getCode() : (item.getQrCode() != null ? item.getQrCode() : ""))).append(";");
            sb.append(";");
            sb.append(item.getMin_temp()).append(";");
            sb.append(item.getMax_temp()).append(";");
            sb.append(item.getWeight()).append(";");
            sb.append(item.getSize_x()).append(";");
            sb.append(item.getSize_y()).append(";");
            sb.append(item.getSize_z()).append(";");
            sb.append(escapeCsv(item.getComment() != null ? item.getComment() : "")).append(";");
            sb.append(item.getExpireAfterDays() != null ? item.getExpireAfterDays() : "").append(";");
            sb.append(item.isDangerous()).append(";\n");
        }
        return sb.toString();
    }

    public String exportAllRacks() {
        List<Rack> racks = rackRepository.findAll();
        return exportRacksToCsv(racks);
    }

    public String exportRacksByWarehouseId(Long warehouseId) {
        List<Rack> racks = rackRepository.findByWarehouseId(warehouseId);
        return exportRacksToCsv(racks);
    }

    private String exportRacksToCsv(List<Rack> racks) {
        StringBuilder sb = new StringBuilder();
        for (Rack rack : racks) {
            sb.append(escapeCsv(rack.getMarker())).append(";");
            sb.append(rack.getSize_x()).append(";");
            sb.append(rack.getSize_y()).append(";");
            sb.append(rack.getMin_temp()).append(";");
            sb.append(rack.getMax_temp()).append(";");
            sb.append(rack.getMax_weight()).append(";");
            sb.append(rack.getMax_size_x()).append(";");
            sb.append(rack.getMax_size_y()).append(";");
            sb.append(rack.getMax_size_z()).append(";");
            sb.append(escapeCsv(rack.getComment() != null ? rack.getComment() : "")).append(";");
            sb.append(rack.isAcceptsDangerous()).append(";\n");
        }
        return sb.toString();
    }

    public String exportAllAssortments() {
        List<Assortment> assortments = assortmentRepository.findAllForInventoryReport(null);
        return exportAssortmentsToCsv(assortments);
    }

    public String exportAssortmentsByWarehouseId(Long warehouseId) {
        List<Assortment> assortments = assortmentRepository.findAllForInventoryReport(warehouseId);
        return exportAssortmentsToCsv(assortments);
    }

    private String exportAssortmentsToCsv(List<Assortment> assortments) {
        StringBuilder sb = new StringBuilder();
        sb.append("item_id;rack_id;position_x;position_y;expires_at\n");
        for (Assortment a : assortments) {
            sb.append(a.getItem().getId()).append(";");
            sb.append(a.getRack().getId()).append(";");
            sb.append(a.getPositionX()).append(";");
            sb.append(a.getPositionY()).append(";");
            if (a.getExpiresAt() != null) {
                sb.append(a.getExpiresAt().toInstant().toString());
            }
            sb.append("\n");
        }
        return sb.toString();
    }

    public String exportAllByWarehouseId(Long warehouseId) {
        StringBuilder sb = new StringBuilder();
        sb.append("=== ITEMS ===\n");
        sb.append(exportItemsByWarehouseId(warehouseId));
        sb.append("\n=== RACKS ===\n");
        sb.append(exportRacksByWarehouseId(warehouseId));
        sb.append("\n=== ASSORTMENTS ===\n");
        sb.append(exportAssortmentsByWarehouseId(warehouseId));
        return sb.toString();
    }

    private String escapeCsv(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\"", "\"\"");
    }
}
