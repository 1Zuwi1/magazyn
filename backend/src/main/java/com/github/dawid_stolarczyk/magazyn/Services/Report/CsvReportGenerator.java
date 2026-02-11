package com.github.dawid_stolarczyk.magazyn.Services.Report;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report.ExpiryReportRow;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report.InventoryStockReportRow;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report.TemperatureAlertAssortmentReportRow;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report.TemperatureAlertRackReportRow;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
public class CsvReportGenerator {

    private static final String UTF8_BOM = "\uFEFF";
    private static final DateTimeFormatter VIOLATION_TIME_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    public byte[] generateExpiryReport(List<ExpiryReportRow> rows) {
        StringBuilder sb = new StringBuilder(UTF8_BOM);
        sb.append("Produkt,Kod,Regał,Magazyn,Ilość,Data wygaśnięcia,Wygasły\n");
        for (ExpiryReportRow row : rows) {
            sb.append(escapeCsv(row.getItemName())).append(',');
            sb.append(escapeCsv(row.getItemCode())).append(',');
            sb.append(escapeCsv(row.getRackMarker())).append(',');
            sb.append(escapeCsv(row.getWarehouseName())).append(',');
            sb.append(row.getQuantity()).append(',');
            sb.append(row.getExpirationDate()).append(',');
            sb.append(row.isAlreadyExpired() ? "Tak" : "Nie").append('\n');
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    public byte[] generateTemperatureAlertReport(List<TemperatureAlertRackReportRow> rackRows, List<TemperatureAlertAssortmentReportRow> assortmentRows) {
        StringBuilder sb = new StringBuilder(UTF8_BOM);

        TreeMap<String, List<TemperatureAlertRackReportRow>> groupedRackRows = rackRows.stream()
                .filter(r -> r.getViolationTimestamp() != null)
                .collect(Collectors.groupingBy(
                        r -> r.getViolationTimestamp().substring(0, 16),
                        TreeMap::new,
                        Collectors.toList()
                ));

        sb.append("--- REGAŁY ---\n");
        for (Map.Entry<String, List<TemperatureAlertRackReportRow>> entry : groupedRackRows.entrySet()) {
            sb.append("\nData: ").append(entry.getKey().toString()).append('\n');
            sb.append("ID regału,Regał,Magazyn,Temperatura [°C],Min [°C],Max [°C],Typ naruszenia,Data,Sensor\n");
            for (TemperatureAlertRackReportRow row : entry.getValue()) {
                sb.append(row.getRackId()).append(',');
                sb.append(escapeCsv(row.getRackMarker())).append(',');
                sb.append(escapeCsv(row.getWarehouseName())).append(',');
                sb.append(row.getRecordedTemperature()).append(',');
                sb.append(row.getAllowedMin()).append(',');
                sb.append(row.getAllowedMax()).append(',');
                sb.append(escapeCsv(row.getViolationType())).append(',');
                sb.append(row.getViolationTimestamp()).append(',');
                sb.append(escapeCsv(row.getSensorId() != null ? row.getSensorId() : "")).append('\n');
            }
        }

        if (assortmentRows != null && !assortmentRows.isEmpty()) {
            TreeMap<String, List<TemperatureAlertAssortmentReportRow>> groupedAssortmentRows = assortmentRows.stream()
                    .filter(r -> r.getViolationTimestamp() != null)
                    .collect(Collectors.groupingBy(
                            r -> r.getViolationTimestamp().substring(0, 16),
                            TreeMap::new,
                            Collectors.toList()
                    ));

            sb.append("\n--- ASORTYMENT ---\n");
            for (Map.Entry<String, List<TemperatureAlertAssortmentReportRow>> entry : groupedAssortmentRows.entrySet()) {
                sb.append("\nData: ").append(entry.getKey().toString()).append('\n');
                sb.append("Regał,Magazyn,Asortyment,Produkt,Temperatura [°C],Min [°C],Max [°C],Typ naruszenia,Data,Sensor\n");
                for (TemperatureAlertAssortmentReportRow row : entry.getValue()) {
                    sb.append(escapeCsv(row.getRackMarker() != null ? row.getRackMarker() : "")).append(',');
                    sb.append(escapeCsv(row.getWarehouseName() != null ? row.getWarehouseName() : "")).append(',');
                    sb.append(escapeCsv(row.getAssortmentCode() != null ? row.getAssortmentCode() : "")).append(',');
                    sb.append(escapeCsv(row.getItemName() != null ? row.getItemName() : "")).append(',');
                    sb.append(row.getRecordedTemperature()).append(',');
                    sb.append(row.getAllowedMin()).append(',');
                    sb.append(row.getAllowedMax()).append(',');
                    sb.append(escapeCsv(row.getViolationType())).append(',');
                    sb.append(row.getViolationTimestamp()).append(',');
                    sb.append(escapeCsv(row.getSensorId() != null ? row.getSensorId() : "")).append('\n');
                }
            }
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    public byte[] generateInventoryStockReport(List<InventoryStockReportRow> rows) {
        StringBuilder sb = new StringBuilder(UTF8_BOM);
        sb.append("Magazyn,ID magazynu,Regał,ID regału,Produkt,Kod,Ilość, Najbliższy przeterminowania\n");
        for (InventoryStockReportRow row : rows) {
            sb.append(escapeCsv(row.getWarehouseName())).append(',');
            sb.append(row.getWarehouseId()).append(',');
            sb.append(escapeCsv(row.getRackMarker())).append(',');
            sb.append(row.getRackId()).append(',');
            sb.append(escapeCsv(row.getItemName())).append(',');
            sb.append(escapeCsv(row.getItemCode())).append(',');
            sb.append(row.getQuantity()).append(',');
            sb.append(row.getNearestExpiresAt() != null ? row.getNearestExpiresAt() : "").append('\n');
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String escapeCsv(String value) {
        if (value == null) {
            return "";
        }
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
