package com.github.dawid_stolarczyk.magazyn.Services.Report;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report.ExpiryReportRow;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report.InventoryStockReportRow;
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
import java.util.List;

@Service
public class ExcelReportGenerator {

    public byte[] generateExpiryReport(List<ExpiryReportRow> rows) {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100)) {
            Sheet sheet = workbook.createSheet("Raport wygasania");
            CellStyle headerStyle = createHeaderStyle(workbook);

            String[] headers = {"Produkt", "Kod", "Data wygaśnięcia", "Regał", "Magazyn", "Ilość", "Wygasły"};
            createHeaderRow(sheet, headers, headerStyle);

            int rowNum = 1;
            for (ExpiryReportRow row : rows) {
                Row excelRow = sheet.createRow(rowNum++);
                excelRow.createCell(0).setCellValue(row.getItemName());
                excelRow.createCell(1).setCellValue(row.getItemCode());
                excelRow.createCell(2).setCellValue(row.getExpirationDate() != null ? row.getExpirationDate().toString() : "");
                excelRow.createCell(3).setCellValue(row.getRackMarker());
                excelRow.createCell(4).setCellValue(row.getWarehouseName());
                excelRow.createCell(5).setCellValue(row.getQuantity());
                excelRow.createCell(6).setCellValue(row.isAlreadyExpired() ? "Tak" : "Nie");
            }

            return toBytes(workbook);
        } catch (IOException e) {
            throw new ReportException(ReportError.REPORT_GENERATION_FAILED, "Excel generation failed", e);
        }
    }

    public byte[] generateTemperatureAlertReport(List<TemperatureAlertRackReportRow> rows) {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100)) {
            Sheet sheet = workbook.createSheet("Raport alertów temperatury");
            CellStyle headerStyle = createHeaderStyle(workbook);

            String[] headers = {"ID regału", "Regał", "Magazyn", "Temperatura [°C]", "Min [°C]", "Max [°C]",
                    "Typ naruszenia", "Data", "Sensor"};
            createHeaderRow(sheet, headers, headerStyle);

            int rowNum = 1;
            for (TemperatureAlertRackReportRow row : rows) {
                Row excelRow = sheet.createRow(rowNum++);
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
                excelRow.createCell(8).setCellValue(row.getNearestExpiresAt() != null ? row.getNearestExpiresAt().toString() : "");
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
