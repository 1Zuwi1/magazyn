package com.github.dawid_stolarczyk.magazyn.Services.ImportExport;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.RackDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.RackImportError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.RackImportReport;
import com.github.dawid_stolarczyk.magazyn.Services.Inventory.RackService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class RackImportService extends AbstractImportService<RackDto, RackImportReport, RackImportError> {
    private static final String[] REQUIRED_COLUMNS = {
            "warehouse_id",
            "size_x",
            "size_y",
            "min_temp",
            "max_temp",
            "max_weight",
            "max_size_x",
            "max_size_y",
            "max_size_z"
    };

    private final RackService rackService;

    public RackImportService(RackService rackService) {
        this.rackService = rackService;
    }

    @Override
    protected String[] getRequiredColumns() {
        return REQUIRED_COLUMNS;
    }

    @Override
    protected RackDto mapToDto(String[] columns, Map<String, Integer> headerIndex) {
        RackDto dto = new RackDto();
        if (headerIndex.containsKey("marker")) {
            dto.setMarker(emptyToNull(value(columns, headerIndex, "marker")));
        }
        dto.setWarehouseId(parseLong(value(columns, headerIndex, "warehouse_id"), "INVALID_WAREHOUSE_ID"));
        if (headerIndex.containsKey("comment")) {
            dto.setComment(emptyToNull(value(columns, headerIndex, "comment")));
        }
        dto.setSizeX(parseInt(value(columns, headerIndex, "size_x"), "INVALID_SIZE_X"));
        dto.setSizeY(parseInt(value(columns, headerIndex, "size_y"), "INVALID_SIZE_Y"));
        dto.setMinTemp(parseFloat(value(columns, headerIndex, "min_temp"), "INVALID_MIN_TEMP"));
        dto.setMaxTemp(parseFloat(value(columns, headerIndex, "max_temp"), "INVALID_MAX_TEMP"));
        dto.setMaxWeight(parseFloat(value(columns, headerIndex, "max_weight"), "INVALID_MAX_WEIGHT"));
        dto.setMaxSizeX(parseFloat(value(columns, headerIndex, "max_size_x"), "INVALID_MAX_SIZE_X"));
        dto.setMaxSizeY(parseFloat(value(columns, headerIndex, "max_size_y"), "INVALID_MAX_SIZE_Y"));
        dto.setMaxSizeZ(parseFloat(value(columns, headerIndex, "max_size_z"), "INVALID_MAX_SIZE_Z"));
        if (headerIndex.containsKey("accepts_dangerous")) {
            String acceptsRaw = value(columns, headerIndex, "accepts_dangerous");
            if (acceptsRaw != null && !acceptsRaw.isBlank()) {
                dto.setAcceptsDangerous(parseBoolean(acceptsRaw));
            }
        }
        return dto;
    }

    @Override
    protected void processDto(RackDto dto) {
        rackService.createRackInternal(dto);
    }

    @Override
    protected RackImportError createError(int lineNumber, String message, String rawLine) {
        return RackImportError.builder()
                .lineNumber(lineNumber)
                .message(message)
                .rawLine(rawLine)
                .build();
    }

    @Override
    protected RackImportReport createReport(int processedLines, int imported, List<RackImportError> errors) {
        return RackImportReport.builder()
                .processedLines(processedLines)
                .imported(imported)
                .errors(errors)
                .build();
    }

    private String emptyToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
