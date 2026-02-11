package com.github.dawid_stolarczyk.magazyn.Services.Report;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report.ExpiryReportRow;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report.InventoryStockReportRow;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.Report.TemperatureAlertRackReportRow;
import com.github.dawid_stolarczyk.magazyn.Exceptions.ReportError;
import com.github.dawid_stolarczyk.magazyn.Exceptions.ReportException;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class PdfReportGenerator {

    private static final Font TITLE_FONT = new Font(Font.HELVETICA, 16, Font.BOLD);
    private static final Font HEADER_FONT = new Font(Font.HELVETICA, 9, Font.BOLD, Color.WHITE);
    private static final Font CELL_FONT = new Font(Font.HELVETICA, 8, Font.NORMAL);
    private static final Font META_FONT = new Font(Font.HELVETICA, 9, Font.ITALIC, Color.GRAY);
    private static final Color HEADER_BG = new Color(55, 65, 81);
    private static final DateTimeFormatter TIMESTAMP_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

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
            addHeaderCell(table, "Data wygaśnięcia");
            addHeaderCell(table, "Regał");
            addHeaderCell(table, "Magazyn");
            addHeaderCell(table, "Ilość");
            addHeaderCell(table, "Wygasły");

            for (ExpiryReportRow row : rows) {
                addCell(table, row.getItemName());
                addCell(table, row.getItemCode());
                addCell(table, row.getExpirationDate() != null ? row.getExpirationDate().toString() : "");
                addCell(table, row.getRackMarker());
                addCell(table, row.getWarehouseName());
                addCell(table, String.valueOf(row.getQuantity()));
                addCell(table, row.isAlreadyExpired() ? "Tak" : "Nie");
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (DocumentException e) {
            throw new ReportException(ReportError.REPORT_GENERATION_FAILED, "PDF generation failed", e);
        }
    }

    public byte[] generateTemperatureAlertReport(List<TemperatureAlertRackReportRow> rows) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4.rotate(), 20, 20, 30, 20);
            PdfWriter.getInstance(document, out);
            document.open();

            addTitle(document, "Raport alertów temperatury (Regały)");
            addMeta(document);

            PdfPTable table = new PdfPTable(9);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1f, 1.5f, 2f, 1.5f, 1f, 1f, 2f, 2f, 1.5f});

            addHeaderCell(table, "ID regału");
            addHeaderCell(table, "Regał");
            addHeaderCell(table, "Magazyn");
            addHeaderCell(table, "Temp [°C]");
            addHeaderCell(table, "Min [°C]");
            addHeaderCell(table, "Max [°C]");
            addHeaderCell(table, "Typ naruszenia");
            addHeaderCell(table, "Data");
            addHeaderCell(table, "Sensor");

            for (TemperatureAlertRackReportRow row : rows) {
                addCell(table, String.valueOf(row.getRackId()));
                addCell(table, row.getRackMarker());
                addCell(table, row.getWarehouseName());
                addCell(table, String.valueOf(row.getRecordedTemperature()));
                addCell(table, String.valueOf(row.getAllowedMin()));
                addCell(table, String.valueOf(row.getAllowedMax()));
                addCell(table, row.getViolationType());
                addCell(table, row.getViolationTimestamp() != null ? row.getViolationTimestamp().toString() : "");
                addCell(table, row.getSensorId() != null ? row.getSensorId() : "");
            }

            document.add(table);
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

    private void addCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "", CELL_FONT));
        cell.setPadding(4);
        table.addCell(cell);
    }
}
