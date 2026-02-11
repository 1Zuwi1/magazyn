package com.github.dawid_stolarczyk.magazyn.Services.Report;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report.ExpiryReportRow;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report.InventoryStockReportRow;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report.TemperatureAlertRackReportRow;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
public class CsvReportGenerator {

    private static final String UTF8_BOM = "\uFEFF";

    public byte[] generateExpiryReport(List<ExpiryReportRow> rows) {
        StringBuilder sb = new StringBuilder(UTF8_BOM);
        sb.append("Produkt,Kod,Data wygaśnięcia,Regał,Magazyn,Ilość,Wygasły\n");
        for (ExpiryReportRow row : rows) {
            sb.append(escapeCsv(row.getItemName())).append(',');
            sb.append(escapeCsv(row.getItemCode())).append(',');
            sb.append(row.getExpirationDate()).append(',');
            sb.append(escapeCsv(row.getRackMarker())).append(',');
            sb.append(escapeCsv(row.getWarehouseName())).append(',');
            sb.append(row.getQuantity()).append(',');
            sb.append(row.isAlreadyExpired() ? "Tak" : "Nie").append('\n');
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    public byte[] generateTemperatureAlertReport(List<TemperatureAlertRackReportRow> rows) {
        StringBuilder sb = new StringBuilder(UTF8_BOM);
        sb.append("ID regału,Regał,Magazyn,Temperatura [°C],Min [°C],Max [°C],Typ naruszenia,Data,Sensor\n");
        for (TemperatureAlertRackReportRow row : rows) {
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
