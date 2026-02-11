package com.github.dawid_stolarczyk.magazyn.Services.Report;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report.ExpiryReportRow;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report.InventoryStockReportRow;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report.TemperatureAlertAssortmentReportRow;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report.TemperatureAlertRackReportRow;
import com.github.dawid_stolarczyk.magazyn.Exceptions.ReportError;
import com.github.dawid_stolarczyk.magazyn.Exceptions.ReportException;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
public class PdfReportGenerator {

    private static final Font TITLE_FONT = new Font(Font.HELVETICA, 16, Font.BOLD);
    private static final Font HEADER_FONT = new Font(Font.HELVETICA, 9, Font.BOLD, Color.WHITE);
    private static final Font CELL_FONT = new Font(Font.HELVETICA, 8, Font.NORMAL);
    private static final Font META_FONT = new Font(Font.HELVETICA, 9, Font.ITALIC, Color.GRAY);
    private static final Color HEADER_BG = new Color(55, 65, 81);
    private static final DateTimeFormatter TIMESTAMP_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final DateTimeFormatter VIOLATION_TIME_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    public byte[] generateExpiryReport(List<ExpiryReportRow> rows) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4.rotate(), 20, 20, 30, 20);
            PdfWriter.getInstance(document, out);
            document.open();

            addTitle(document, "Raport wygasania produktów");
            addMeta(document);

            PdfPTable table = new PdfPTable(7);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{3f, 2f, 2f, 1.5f, 2.5f, 1f, 1f});

            addHeaderCell(table, "Produkt");
            addHeaderCell(table, "Kod");
            addHeaderCell(table, "Regał");
            addHeaderCell(table, "Magazyn");
            addHeaderCell(table, "Ilość");
            addHeaderCell(table, "Data przeterminowania");
            addHeaderCell(table, "Wygasły");

            for (ExpiryReportRow row : rows) {
                addCell(table, row.getItemName());
                addCell(table, row.getItemCode());
                addCell(table, row.getRackMarker());
                addCell(table, row.getWarehouseName());
                addCell(table, String.valueOf(row.getQuantity()));
                addCell(table, row.getExpirationDate() != null ? row.getExpirationDate() : "");
                addCell(table, row.isAlreadyExpired() ? "Tak" : "Nie");
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (DocumentException e) {
            throw new ReportException(ReportError.REPORT_GENERATION_FAILED, "PDF generation failed", e);
        }
    }

    public byte[] generateTemperatureAlertReport(List<TemperatureAlertRackReportRow> rackRows, List<TemperatureAlertAssortmentReportRow> assortmentRows) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4.rotate(), 20, 20, 30, 20);
            PdfWriter.getInstance(document, out);
            document.open();

            addTitle(document, "Raport alertów temperatury");
            addMeta(document);

            addSectionTitle(document, "Regały");

            TreeMap<String, List<TemperatureAlertRackReportRow>> groupedRackRows = rackRows.stream()
                    .filter(r -> r.getViolationTimestamp() != null)
                    .collect(Collectors.groupingBy(
                            r -> r.getViolationTimestamp().substring(0, 16),
                            TreeMap::new,
                            Collectors.toList()
                    ));

            for (Map.Entry<String, List<TemperatureAlertRackReportRow>> entry : groupedRackRows.entrySet()) {
                addSubSectionTitle(document, entry.getKey());

                PdfPTable rackTable = new PdfPTable(9);
                rackTable.setWidthPercentage(100);
                rackTable.setWidths(new float[]{1f, 1.5f, 2f, 1.5f, 1f, 1f, 2f, 2f, 1.5f});

                addHeaderCell(rackTable, "ID regału");
                addHeaderCell(rackTable, "Regał");
                addHeaderCell(rackTable, "Magazyn");
                addHeaderCell(rackTable, "Temp [°C]");
                addHeaderCell(rackTable, "Min [°C]");
                addHeaderCell(rackTable, "Max [°C]");
                addHeaderCell(rackTable, "Typ naruszenia");
                addHeaderCell(rackTable, "Data");
                addHeaderCell(rackTable, "Sensor");

                for (TemperatureAlertRackReportRow row : entry.getValue()) {
                    addCell(rackTable, String.valueOf(row.getRackId()));
                    addCell(rackTable, row.getRackMarker());
                    addCell(rackTable, row.getWarehouseName());
                    addCell(rackTable, String.valueOf(row.getRecordedTemperature()));
                    addCell(rackTable, String.valueOf(row.getAllowedMin()));
                    addCell(rackTable, String.valueOf(row.getAllowedMax()));
                    addCell(rackTable, row.getViolationType());
                    addCell(rackTable, row.getViolationTimestamp());
                    addCell(rackTable, row.getSensorId());
                }

                document.add(rackTable);
            }

            if (assortmentRows != null && !assortmentRows.isEmpty()) {
                document.add(new Paragraph(" ", new Font(Font.HELVETICA, 10)));
                addSectionTitle(document, "Asortyment");

                TreeMap<String, List<TemperatureAlertAssortmentReportRow>> groupedAssortmentRows = assortmentRows.stream()
                        .filter(r -> r.getViolationTimestamp() != null)
                        .collect(Collectors.groupingBy(
                                r -> r.getViolationTimestamp().substring(0, 16),
                                TreeMap::new,
                                Collectors.toList()
                        ));

                for (Map.Entry<String, List<TemperatureAlertAssortmentReportRow>> entry : groupedAssortmentRows.entrySet()) {
                    addSubSectionTitle(document, entry.getKey());

                    PdfPTable assortmentTable = new PdfPTable(9);
                    assortmentTable.setWidthPercentage(100);
                    assortmentTable.setWidths(new float[]{1.5f, 2f, 2.5f, 1.5f, 1f, 1f, 2f, 2f, 1.5f});

                    addHeaderCell(assortmentTable, "Regał");
                    addHeaderCell(assortmentTable, "Magazyn");
                    addHeaderCell(assortmentTable, "Produkt");
                    addHeaderCell(assortmentTable, "Temp [°C]");
                    addHeaderCell(assortmentTable, "Min [°C]");
                    addHeaderCell(assortmentTable, "Max [°C]");
                    addHeaderCell(assortmentTable, "Typ naruszenia");
                    addHeaderCell(assortmentTable, "Data");
                    addHeaderCell(assortmentTable, "Sensor");

                    for (TemperatureAlertAssortmentReportRow row : entry.getValue()) {
                        addCell(assortmentTable, row.getRackMarker() != null ? row.getRackMarker() : "");
                        addCell(assortmentTable, row.getWarehouseName() != null ? row.getWarehouseName() : "");
                        addCell(assortmentTable, row.getItemName() != null ? row.getItemName() : "");
                        addCell(assortmentTable, String.valueOf(row.getRecordedTemperature()));
                        addCell(assortmentTable, String.valueOf(row.getAllowedMin()));
                        addCell(assortmentTable, String.valueOf(row.getAllowedMax()));
                        addCell(assortmentTable, row.getViolationType());
                        addCell(assortmentTable, row.getViolationTimestamp());
                        addCell(assortmentTable, row.getSensorId());
                    }

                    document.add(assortmentTable);
                }
            }

            document.close();
            return out.toByteArray();
        } catch (DocumentException e) {
            throw new ReportException(ReportError.REPORT_GENERATION_FAILED, "PDF generation failed", e);
        }
    }

    public byte[] generateInventoryStockReport(List<InventoryStockReportRow> rows) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4.rotate(), 20, 20, 30, 20);
            PdfWriter.getInstance(document, out);
            document.open();

            addTitle(document, "Raport stanu magazynu");
            addMeta(document);

            PdfPTable table = new PdfPTable(9);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{2f, 1f, 1.5f, 1f, 2.5f, 1.5f, 1f, 2f, 2f});

            addHeaderCell(table, "Magazyn");
            addHeaderCell(table, "ID mag.");
            addHeaderCell(table, "Regał");
            addHeaderCell(table, "ID reg.");
            addHeaderCell(table, "Produkt");
            addHeaderCell(table, "Kod");
            addHeaderCell(table, "Ilość");
            addHeaderCell(table, "Najbliższy przterminowania");

            for (InventoryStockReportRow row : rows) {
                addCell(table, row.getWarehouseName());
                addCell(table, String.valueOf(row.getWarehouseId()));
                addCell(table, row.getRackMarker());
                addCell(table, String.valueOf(row.getRackId()));
                addCell(table, row.getItemName());
                addCell(table, row.getItemCode());
                addCell(table, String.valueOf(row.getQuantity()));
                addCell(table, row.getNearestExpiresAt() != null ? row.getNearestExpiresAt().toString() : "");
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (DocumentException e) {
            throw new ReportException(ReportError.REPORT_GENERATION_FAILED, "PDF generation failed", e);
        }
    }

    private void addTitle(Document document, String title) throws DocumentException {
        Paragraph p = new Paragraph(title, TITLE_FONT);
        p.setAlignment(Element.ALIGN_CENTER);
        p.setSpacingAfter(10);
        document.add(p);
    }

    private void addMeta(Document document) throws DocumentException {
        Paragraph p = new Paragraph("Wygenerowano: " + LocalDateTime.now().format(TIMESTAMP_FMT), META_FONT);
        p.setAlignment(Element.ALIGN_RIGHT);
        p.setSpacingAfter(15);
        document.add(p);
    }

    private void addHeaderCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, HEADER_FONT));
        cell.setBackgroundColor(HEADER_BG);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setPadding(5);
        table.addCell(cell);
    }

    private void addSectionTitle(Document document, String title) throws DocumentException {
        Paragraph p = new Paragraph(title, new Font(Font.HELVETICA, 12, Font.BOLD));
        p.setAlignment(Element.ALIGN_LEFT);
        p.setSpacingAfter(8);
        p.setSpacingBefore(8);
        document.add(p);
    }

    private void addSubSectionTitle(Document document, String title) throws DocumentException {
        Paragraph p = new Paragraph("Data: " + title, new Font(Font.HELVETICA, 10, Font.BOLD));
        p.setAlignment(Element.ALIGN_LEFT);
        p.setSpacingAfter(6);
        p.setSpacingBefore(6);
        document.add(p);
    }

    private void addCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "", CELL_FONT));
        cell.setPadding(4);
        table.addCell(cell);
    }
}
