package com.github.dawid_stolarczyk.magazyn.Services.ImportExport;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.AssortmentDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.AssortmentImportError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.AssortmentImportReport;
import com.github.dawid_stolarczyk.magazyn.Services.Inventory.AssortmentService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class AssortmentImportService extends AbstractImportService<AssortmentDto, AssortmentImportReport, AssortmentImportError> {
    private static final String[] REQUIRED_COLUMNS = {
            "item_id",
            "rack_id",
            "position_x",
            "position_y"
    };

    private final AssortmentService assortmentService;

    public AssortmentImportService(AssortmentService assortmentService) {
        this.assortmentService = assortmentService;
    }

    @Override
    protected String[] getRequiredColumns() {
        return REQUIRED_COLUMNS;
    }

    @Override
    protected AssortmentDto mapToDto(String[] columns, Map<String, Integer> headerIndex) {
        AssortmentDto dto = new AssortmentDto();
        dto.setItemId(parseLong(value(columns, headerIndex, "item_id"), "INVALID_ITEM_ID"));
        dto.setRackId(parseLong(value(columns, headerIndex, "rack_id"), "INVALID_RACK_ID"));
        dto.setPositionX(parseInt(value(columns, headerIndex, "position_x"), "INVALID_POSITION_X"));
        dto.setPositionY(parseInt(value(columns, headerIndex, "position_y"), "INVALID_POSITION_Y"));

        if (headerIndex.containsKey("expires_at")) {
            String expiresRaw = value(columns, headerIndex, "expires_at");
            if (expiresRaw != null && !expiresRaw.isBlank()) {
                dto.setExpiresAt(parseTimestamp(expiresRaw, "INVALID_EXPIRES_AT"));
            }
        }
        return dto;
    }

    @Override
    protected void processDto(AssortmentDto dto) {
        assortmentService.createAssortmentInternal(dto);
    }

    @Override
    protected AssortmentImportError createError(int lineNumber, String message, String rawLine) {
        return AssortmentImportError.builder()
                .lineNumber(lineNumber)
                .message(message)
                .rawLine(rawLine)
                .build();
    }

    @Override
    protected AssortmentImportReport createReport(int processedLines, int imported, List<AssortmentImportError> errors) {
        return AssortmentImportReport.builder()
                .processedLines(processedLines)
                .imported(imported)
                .errors(errors)
                .build();
    }
}
