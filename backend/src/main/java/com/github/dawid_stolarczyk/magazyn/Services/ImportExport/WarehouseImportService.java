package com.github.dawid_stolarczyk.magazyn.Services.ImportExport;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.WarehouseDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.WarehouseImportError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.WarehouseImportReport;
import com.github.dawid_stolarczyk.magazyn.Services.Inventory.WarehouseService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class WarehouseImportService extends AbstractImportService<WarehouseDto, WarehouseImportReport, WarehouseImportError> {
    private static final String[] REQUIRED_COLUMNS = {
            "name"
    };

    private final WarehouseService warehouseService;

    public WarehouseImportService(WarehouseService warehouseService) {
        this.warehouseService = warehouseService;
    }

    @Override
    protected String[] getRequiredColumns() {
        return REQUIRED_COLUMNS;
    }

    @Override
    protected WarehouseDto mapToDto(String[] columns, Map<String, Integer> headerIndex) {
        String name = value(columns, headerIndex, "name");
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("INVALID_NAME");
        }
        return WarehouseDto.builder().name(name).build();
    }

    @Override
    protected void processDto(WarehouseDto dto) {
        warehouseService.createWarehouse(dto);
    }

    @Override
    protected WarehouseImportError createError(int lineNumber, String message, String rawLine) {
        return WarehouseImportError.builder()
                .lineNumber(lineNumber)
                .message(message)
                .rawLine(rawLine)
                .build();
    }

    @Override
    protected WarehouseImportReport createReport(int processedLines, int imported, List<WarehouseImportError> errors) {
        return WarehouseImportReport.builder()
                .processedLines(processedLines)
                .imported(imported)
                .errors(errors)
                .build();
    }
}
