package com.github.dawid_stolarczyk.magazyn.Services.Report;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report.ExpiryReportRow;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report.InventoryStockReportRow;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report.TemperatureAlertAssortmentReportRow;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report.TemperatureAlertRackReportRow;
import com.github.dawid_stolarczyk.magazyn.Exceptions.ReportError;
import com.github.dawid_stolarczyk.magazyn.Exceptions.ReportException;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.ReportFormat;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.ReportType;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.WarehouseRepository;
import com.github.dawid_stolarczyk.magazyn.Services.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportExportService {

    private final ReportDataService reportDataService;
    private final PdfReportGenerator pdfReportGenerator;
    private final ExcelReportGenerator excelReportGenerator;
    private final CsvReportGenerator csvReportGenerator;
    private final EmailService emailService;
    private final WarehouseRepository warehouseRepository;

    private static final DateTimeFormatter FILE_DATE_FMT = DateTimeFormatter.ofPattern("yyyyMMdd_HHmm");

    public byte[] generateExpiryReport(Long warehouseId, ReportFormat format, int daysAhead) {
        validateWarehouse(warehouseId);
        List<ExpiryReportRow> data = reportDataService.collectExpiryData(warehouseId, daysAhead);
        return switch (format) {
            case PDF -> pdfReportGenerator.generateExpiryReport(data);
            case EXCEL -> excelReportGenerator.generateExpiryReport(data);
            case CSV -> csvReportGenerator.generateExpiryReport(data);
        };
    }

    public byte[] generateTemperatureAlertReport(Long warehouseId, ReportFormat format,
                                                  Instant startDate, Instant endDate) {
        validateWarehouse(warehouseId);
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new ReportException(ReportError.INVALID_DATE_RANGE);
        }
        List<TemperatureAlertRackReportRow> dataRacks = reportDataService.collectTemperatureAlertRacksData(warehouseId, startDate, endDate);
        List<TemperatureAlertAssortmentReportRow> dataAssortments = reportDataService.collectTemperatureAlertAssortmentsData(warehouseId, startDate, endDate);
        return switch (format) {
            case PDF -> pdfReportGenerator.generateTemperatureAlertReport(dataRacks, dataAssortments);
            case EXCEL -> excelReportGenerator.generateTemperatureAlertReport(dataRacks, dataAssortments);
            case CSV -> csvReportGenerator.generateTemperatureAlertReport(dataRacks, dataAssortments);
        };
    }

    public byte[] generateInventoryStockReport(Long warehouseId, ReportFormat format) {
        validateWarehouse(warehouseId);
        List<InventoryStockReportRow> data = reportDataService.collectInventoryStockData(warehouseId);
        return switch (format) {
            case PDF -> pdfReportGenerator.generateInventoryStockReport(data);
            case EXCEL -> excelReportGenerator.generateInventoryStockReport(data);
            case CSV -> csvReportGenerator.generateInventoryStockReport(data);
        };
    }

    public void sendReportByEmail(String email, byte[] fileBytes, ReportType reportType, ReportFormat format) {
        String title = getReportTitle(reportType);
        String filename = buildFilename(reportType, format);
        String contentType = getContentType(format);
        emailService.sendReportEmail(email, title, fileBytes, filename, contentType);
    }

    public String buildFilename(ReportType reportType, ReportFormat format) {
        String timestamp = LocalDateTime.now().format(FILE_DATE_FMT);
        String baseName = switch (reportType) {
            case EXPIRY -> "raport_wygasania";
            case TEMPERATURE_ALERTS -> "raport_temperatury";
            case INVENTORY_STOCK -> "raport_stanu_magazynu";
        };
        String extension = switch (format) {
            case PDF -> ".pdf";
            case EXCEL -> ".xlsx";
            case CSV -> ".csv";
        };
        return baseName + "_" + timestamp + extension;
    }

    public String getContentType(ReportFormat format) {
        return switch (format) {
            case PDF -> "application/pdf";
            case EXCEL -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            case CSV -> "text/csv; charset=UTF-8";
        };
    }

    private String getReportTitle(ReportType reportType) {
        return switch (reportType) {
            case EXPIRY -> "Raport wygasania produktów";
            case TEMPERATURE_ALERTS -> "Raport alertów temperatury";
            case INVENTORY_STOCK -> "Raport stanu magazynu";
        };
    }

    private void validateWarehouse(Long warehouseId) {
        if (warehouseId != null && !warehouseRepository.existsById(warehouseId)) {
            throw new ReportException(ReportError.WAREHOUSE_NOT_FOUND);
        }
    }
}
