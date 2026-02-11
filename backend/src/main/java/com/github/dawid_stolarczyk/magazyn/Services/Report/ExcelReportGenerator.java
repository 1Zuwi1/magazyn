package com.github.dawid_stolarczyk.magazyn.Services.Report;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report.ExpiryReportRow;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report.InventoryStockReportRow;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report.TemperatureAlertAssortmentReportRow;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report.TemperatureAlertRackReportRow;
import com.github.dawid_stolarczyk.magazyn.Exceptions.ReportError;
import com.github.dawid_stolarczyk.magazyn.Exceptions.ReportException;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
public class ExcelReportGenerator {

    private static final DateTimeFormatter VIOLATION_TIME_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    public byte[] generateExpiryReport(List<ExpiryReportRow> rows) {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100)) {
            Sheet sheet = workbook.createSheet("Raport wygasania");
            CellStyle headerStyle = createHeaderStyle(workbook);

            String[] headers = {"Produkt", "Kod", "Regał", "Magazyn", "Ilość", "Data przeterminowania", "Wygasły"};
            createHeaderRow(sheet, headers, headerStyle);

            int rowNum = 1;
            for (ExpiryReportRow row : rows) {
                Row excelRow = sheet.createRow(rowNum++);
                excelRow.createCell(0).setCellValue(row.getItemName());
                excelRow.createCell(1).setCellValue(row.getItemCode());
                excelRow.createCell(2).setCellValue(row.getRackMarker());
                excelRow.createCell(3).setCellValue(row.getWarehouseName());
                excelRow.createCell(4).setCellValue(row.getQuantity());
                excelRow.createCell(5).setCellValue(row.getExpirationDate() != null ? row.getExpirationDate().toString() : "");
                excelRow.createCell(6).setCellValue(row.isAlreadyExpired() ? "Tak" : "Nie");
            }

            return toBytes(workbook);
        } catch (IOException e) {
            throw new ReportException(ReportError.REPORT_GENERATION_FAILED, "Excel generation failed", e);
        }
    }

    public byte[] generateTemperatureAlertReport(List<TemperatureAlertRackReportRow> rackRows, List<TemperatureAlertAssortmentReportRow> assortmentRows) {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100)) {
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dateHeaderStyle = createDateHeaderStyle(workbook);

            Sheet rackSheet = workbook.createSheet("Regały");

            TreeMap<String, List<TemperatureAlertRackReportRow>> groupedRackRows = rackRows.stream()
                    .filter(r -> r.getViolationTimestamp() != null)
                    .collect(Collectors.groupingBy(
                            r -> r.getViolationTimestamp().substring(0, 16),
                            TreeMap::new,
                            Collectors.toList()
                    ));

            int rowNum = 0;
            for (Map.Entry<String, List<TemperatureAlertRackReportRow>> entry : groupedRackRows.entrySet()) {
                Row dateHeaderRow = rackSheet.createRow(rowNum++);
                dateHeaderRow.createCell(0).setCellValue("Data: " + entry.getKey().toString());
                dateHeaderRow.getCell(0).setCellStyle(dateHeaderStyle);

                String[] rackHeaders = {"ID regału", "Regał", "Magazyn", "Temperatura [°C]", "Min [°C]", "Max [°C]",
                        "Typ naruszenia", "Data", "Sensor"};
                Row headerRow = rackSheet.createRow(rowNum++);
                for (int i = 0; i < rackHeaders.length; i++) {
                    var cell = headerRow.createCell(i);
                    cell.setCellValue(rackHeaders[i]);
                    cell.setCellStyle(headerStyle);
                }

                for (TemperatureAlertRackReportRow row : entry.getValue()) {
                    Row excelRow = rackSheet.createRow(rowNum++);
                    excelRow.createCell(0).setCellValue(row.getRackId());
                    excelRow.createCell(1).setCellValue(row.getRackMarker());
                    excelRow.createCell(2).setCellValue(row.getWarehouseName());
                    excelRow.createCell(3).setCellValue(row.getRecordedTemperature());
                    excelRow.createCell(4).setCellValue(row.getAllowedMin());
                    excelRow.createCell(5).setCellValue(row.getAllowedMax());
                    excelRow.createCell(6).setCellValue(row.getViolationType());
                    excelRow.createCell(7).setCellValue(row.getViolationTimestamp() != null ? row.getViolationTimestamp().toString() : "");
                    excelRow.createCell(8).setCellValue(row.getSensorId() != null ? row.getSensorId() : "");
                }

                if (rowNum < entry.getValue().size() + 2) {
                    rowNum = entry.getValue().size() + 2;
                }
                rowNum++;
            }

            if (assortmentRows != null && !assortmentRows.isEmpty()) {
                Sheet assortmentSheet = workbook.createSheet("Asortyment");

                TreeMap<String, List<TemperatureAlertAssortmentReportRow>> groupedAssortmentRows = assortmentRows.stream()
                        .filter(r -> r.getViolationTimestamp() != null)
                        .collect(Collectors.groupingBy(
                                r -> r.getViolationTimestamp().substring(0, 16),
                                TreeMap::new,
                                Collectors.toList()
                        ));

                rowNum = 0;
                for (Map.Entry<String, List<TemperatureAlertAssortmentReportRow>> entry : groupedAssortmentRows.entrySet()) {
                    Row dateHeaderRow = assortmentSheet.createRow(rowNum++);
                    dateHeaderRow.createCell(0).setCellValue("Data: " + entry.getKey().toString());
                    dateHeaderRow.getCell(0).setCellStyle(dateHeaderStyle);

                    String[] assortmentHeaders = {"Regał", "Magazyn", "Produkt", "Kod asortymentu", "Temperatura [°C]", "Min [°C]", "Max [°C]",
                            "Typ naruszenia", "Data", "Sensor"};
                    Row headerRow = assortmentSheet.createRow(rowNum++);
                    for (int i = 0; i < assortmentHeaders.length; i++) {
                        var cell = headerRow.createCell(i);
                        cell.setCellValue(assortmentHeaders[i]);
                        cell.setCellStyle(headerStyle);
                    }

                    for (TemperatureAlertAssortmentReportRow row : entry.getValue()) {
                        Row excelRow = assortmentSheet.createRow(rowNum++);
                        excelRow.createCell(0).setCellValue(row.getRackMarker() != null ? row.getRackMarker() : "");
                        excelRow.createCell(1).setCellValue(row.getWarehouseName() != null ? row.getWarehouseName() : "");
                        excelRow.createCell(2).setCellValue(row.getItemName() != null ? row.getItemName() : "");
                        excelRow.createCell(3).setCellValue(row.getAssortmentCode() != null ? row.getAssortmentCode() : "");
                        excelRow.createCell(4).setCellValue(row.getRecordedTemperature());
                        excelRow.createCell(5).setCellValue(row.getAllowedMin());
                        excelRow.createCell(6).setCellValue(row.getAllowedMax());
                        excelRow.createCell(7).setCellValue(row.getViolationType());
                        excelRow.createCell(8).setCellValue(row.getViolationTimestamp() != null ? row.getViolationTimestamp() : "");
                        excelRow.createCell(9).setCellValue(row.getSensorId() != null ? row.getSensorId() : "");
                    }

                    rowNum++;
                }
            }

            return toBytes(workbook);
        } catch (IOException e) {
            throw new ReportException(ReportError.REPORT_GENERATION_FAILED, "Excel generation failed", e);
        }
    }

    public byte[] generateInventoryStockReport(List<InventoryStockReportRow> rows) {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100)) {
            Sheet sheet = workbook.createSheet("Raport stanu magazynu");
            CellStyle headerStyle = createHeaderStyle(workbook);

            String[] headers = {"Magazyn", "ID magazynu", "Regał", "ID regału", "Produkt", "Kod",
                    "Ilość", "Najbliższy przeterminowania"};
            createHeaderRow(sheet, headers, headerStyle);

            int rowNum = 1;
            for (InventoryStockReportRow row : rows) {
                Row excelRow = sheet.createRow(rowNum++);
                excelRow.createCell(0).setCellValue(row.getWarehouseName());
                excelRow.createCell(1).setCellValue(row.getWarehouseId());
                excelRow.createCell(2).setCellValue(row.getRackMarker());
                excelRow.createCell(3).setCellValue(row.getRackId());
                excelRow.createCell(4).setCellValue(row.getItemName());
                excelRow.createCell(5).setCellValue(row.getItemCode());
                excelRow.createCell(6).setCellValue(row.getQuantity());
                excelRow.createCell(7).setCellValue(row.getNearestExpiresAt() != null ? row.getNearestExpiresAt().toString() : "");
            }

            return toBytes(workbook);
        } catch (IOException e) {
            throw new ReportException(ReportError.REPORT_GENERATION_FAILED, "Excel generation failed", e);
        }
    }

    private CellStyle createHeaderStyle(SXSSFWorkbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        return style;
    }

    private CellStyle createDateHeaderStyle(SXSSFWorkbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 12);
        style.setFont(font);
        return style;
    }

    private void createHeaderRow(Sheet sheet, String[] headers, CellStyle style) {
        Row headerRow = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            var cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(style);
        }
    }

    private byte[] toBytes(SXSSFWorkbook workbook) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        workbook.write(out);
        workbook.dispose();
        return out.toByteArray();
    }
}
