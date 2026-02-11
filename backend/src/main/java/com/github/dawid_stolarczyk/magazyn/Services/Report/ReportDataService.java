package com.github.dawid_stolarczyk.magazyn.Services.Report;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report.ExpiryReportRow;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report.InventoryStockReportRow;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report.TemperatureAlertAssortmentReportRow;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report.TemperatureAlertRackReportRow;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Assortment;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.RackReport;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.AssortmentRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.RackReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportDataService {

    private final AssortmentRepository assortmentRepository;
    private final RackReportRepository rackReportRepository;

    @Transactional(readOnly = true)
    public List<ExpiryReportRow> collectExpiryData(Long warehouseId, int daysAhead) {
        Timestamp threshold = Timestamp.from(Instant.now().plusSeconds((long) daysAhead * 24 * 60 * 60));
        List<Assortment> assortments = assortmentRepository.findAllExpiringBefore(threshold, warehouseId);

        Instant now = Instant.now();
        // Group by (item, rack) to aggregate quantity
        Map<String, ExpiryGrouping> grouped = new LinkedHashMap<>();
        for (Assortment a : assortments) {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
            String dateStr = sdf.format(Timestamp.from(a.getExpiresAt().toInstant()));
            String key = a.getItem().getId() + "-" + a.getRack().getId() + "-" + dateStr;
            grouped.computeIfAbsent(key, k -> new ExpiryGrouping(
                    a.getItem().getName(),
                    a.getItem().getCode(),
                    a.getExpiresAt().toInstant().atZone(ZoneId.systemDefault()).toLocalDate(),
                    a.getRack().getMarker(),
                    a.getRack().getWarehouse().getName(),
                    a.getExpiresAt().toInstant().isBefore(now)
            )).incrementQuantity();
        }

        List<ExpiryReportRow> rows = new ArrayList<>();
        for (ExpiryGrouping g : grouped.values()) {
            rows.add(ExpiryReportRow.builder()
                    .itemName(g.itemName)
                    .itemCode(g.itemCode)
                    .expirationDate(g.expirationDate)
                    .rackMarker(g.rackMarker)
                    .warehouseName(g.warehouseName)
                    .quantity(g.quantity)
                    .alreadyExpired(g.alreadyExpired)
                    .build());
        }
        return rows;
    }

    @Transactional(readOnly = true)
    public List<TemperatureAlertRackReportRow> collectTemperatureAlertRacksData(Long warehouseId, Instant start, Instant end) {
        List<RackReport> reports = rackReportRepository.findAlertTriggeredReports(warehouseId, start, end);

        List<TemperatureAlertRackReportRow> rows = new ArrayList<>();
        for (RackReport r : reports) {
            String violationType;
            if (r.getCurrentTemperature() > r.getRack().getMax_temp()) {
                violationType = "Za wysoka temperatura";
            } else if (r.getCurrentTemperature() < r.getRack().getMin_temp()) {
                violationType = "Za niska temperatura";
            } else {
                violationType = "Nieznany typ naruszenia";
            }

            rows.add(TemperatureAlertRackReportRow.builder()
                    .rackId(r.getRack().getId())
                    .rackMarker(r.getRack().getMarker())
                    .warehouseName(r.getRack().getWarehouse().getName())
                    .recordedTemperature(r.getCurrentTemperature())
                    .allowedMin(r.getRack().getMin_temp())
                    .allowedMax(r.getRack().getMax_temp())
                    .violationType(violationType)
                    .violationTimestamp(r.getCreatedAt())
                    .sensorId(r.getSensorId())
                    .build());
        }
        return rows;
    }

    @Transactional(readOnly = true)
    public List<TemperatureAlertAssortmentReportRow> collectTemperatureAlertAssortmentsData(Long warehouseId, Instant start, Instant end) {
        List<RackReport> rackReports = assortmentRepository.findAlertTriggeredReports(warehouseId, start, end);

        List<TemperatureAlertAssortmentReportRow> rows = new ArrayList<>();
        for (RackReport r : rackReports) {
            for (Assortment a : r.getRack().getAssortments()) {
                String violationType;

                if (r.getCurrentTemperature() > a.getItem().getMax_temp()) {
                    violationType = "Za wysoka temperatura";
                } else if (r.getCurrentTemperature() < a.getItem().getMin_temp()) {
                    violationType = "Za niska temperatura";
                } else {
                    violationType = "Nieznany typ naruszenia";
                }

                rows.add(TemperatureAlertAssortmentReportRow.builder()
                        .rackMarker(r.getRack().getMarker())
                        .warehouseName(r.getRack().getWarehouse().getName())
                        .itemName( a.getItem().getName())
                        .recordedTemperature(r.getCurrentTemperature())
                        .allowedMin(r.getRack().getMin_temp())
                        .allowedMax(r.getRack().getMax_temp())
                        .violationType(violationType)
                        .violationTimestamp(r.getCreatedAt())
                        .sensorId(r.getSensorId())
                        .build());
            }
        }
        return rows;
    }

    @Transactional(readOnly = true)
    public List<InventoryStockReportRow> collectInventoryStockData(Long warehouseId) {
        List<Assortment> assortments = assortmentRepository.findAllForInventoryReport(warehouseId);

        // Group by (warehouse, rack, item) to aggregate
        Map<String, InventoryGrouping> grouped = new LinkedHashMap<>();
        for (Assortment a : assortments) {
            String key = a.getRack().getWarehouse().getId() + "-" + a.getRack().getId() + "-" + a.getItem().getId();
            InventoryGrouping group = grouped.computeIfAbsent(key, k -> new InventoryGrouping(
                    a.getRack().getWarehouse().getName(),
                    a.getRack().getWarehouse().getId(),
                    a.getRack().getMarker(),
                    a.getRack().getId(),
                    a.getItem().getName(),
                    a.getItem().getCode()
            ));
            group.incrementQuantity();
            LocalDateTime createdAt = a.getCreatedAt().toLocalDateTime();
            if (group.oldestCreatedAt == null || createdAt.isBefore(group.oldestCreatedAt)) {
                group.oldestCreatedAt = createdAt;
            }
            if (a.getExpiresAt() != null) {
                LocalDate expiresAt = a.getExpiresAt().toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
                if (group.nearestExpiresAt == null || expiresAt.isBefore(group.nearestExpiresAt)) {
                    group.nearestExpiresAt = expiresAt;
                }
            }
        }

        List<InventoryStockReportRow> rows = new ArrayList<>();
        for (InventoryGrouping g : grouped.values()) {
            rows.add(InventoryStockReportRow.builder()
                    .warehouseName(g.warehouseName)
                    .warehouseId(g.warehouseId)
                    .rackMarker(g.rackMarker)
                    .rackId(g.rackId)
                    .itemName(g.itemName)
                    .itemCode(g.itemCode)
                    .quantity(g.quantity)
                    .oldestCreatedAt(g.oldestCreatedAt)
                    .nearestExpiresAt(g.nearestExpiresAt)
                    .build());
        }
        return rows;
    }

    private static class ExpiryGrouping {
        final String itemName;
        final String itemCode;
        final LocalDate expirationDate;
        final String rackMarker;
        final String warehouseName;
        final boolean alreadyExpired;
        int quantity;

        ExpiryGrouping(String itemName, String itemCode, LocalDate expirationDate,
                       String rackMarker, String warehouseName, boolean alreadyExpired) {
            this.itemName = itemName;
            this.itemCode = itemCode;
            this.expirationDate = expirationDate;
            this.rackMarker = rackMarker;
            this.warehouseName = warehouseName;
            this.alreadyExpired = alreadyExpired;
            this.quantity = 0;
        }

        void incrementQuantity() {
            quantity++;
        }
    }

    private static class InventoryGrouping {
        final String warehouseName;
        final Long warehouseId;
        final String rackMarker;
        final Long rackId;
        final String itemName;
        final String itemCode;
        int quantity;
        LocalDateTime oldestCreatedAt;
        LocalDate nearestExpiresAt;

        InventoryGrouping(String warehouseName, Long warehouseId, String rackMarker,
                          Long rackId, String itemName, String itemCode) {
            this.warehouseName = warehouseName;
            this.warehouseId = warehouseId;
            this.rackMarker = rackMarker;
            this.rackId = rackId;
            this.itemName = itemName;
            this.itemCode = itemCode;
            this.quantity = 0;
        }

        void incrementQuantity() {
            quantity++;
        }
    }
}
