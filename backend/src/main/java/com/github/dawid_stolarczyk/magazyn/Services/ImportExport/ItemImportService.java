package com.github.dawid_stolarczyk.magazyn.Services.ImportExport;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ItemDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ItemImportError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ItemImportReport;
import com.github.dawid_stolarczyk.magazyn.Services.Inventory.ItemService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class ItemImportService extends AbstractImportService<ItemDto, ItemImportReport, ItemImportError> {
    private static final String[] REQUIRED_COLUMNS = {
            "name",
            "min_temp",
            "max_temp",
            "weight",
            "size_x",
            "size_y",
            "size_z"
    };

    private final ItemService itemService;

    public ItemImportService(ItemService itemService) {
        this.itemService = itemService;
    }

    @Override
    protected String[] getRequiredColumns() {
        return REQUIRED_COLUMNS;
    }

    @Override
    protected ItemDto mapToDto(String[] columns, Map<String, Integer> headerIndex) {
        ItemDto dto = new ItemDto();
        dto.setName(value(columns, headerIndex, "name"));
        dto.setMinTemp(parseFloat(value(columns, headerIndex, "min_temp"), "INVALID_MIN_TEMP"));
        dto.setMaxTemp(parseFloat(value(columns, headerIndex, "max_temp"), "INVALID_MAX_TEMP"));
        dto.setWeight(parseFloat(value(columns, headerIndex, "weight"), "INVALID_WEIGHT"));
        dto.setSizeX(parseFloat(value(columns, headerIndex, "size_x"), "INVALID_SIZE_X"));
        dto.setSizeY(parseFloat(value(columns, headerIndex, "size_y"), "INVALID_SIZE_Y"));
        dto.setSizeZ(parseFloat(value(columns, headerIndex, "size_z"), "INVALID_SIZE_Z"));

        if (headerIndex.containsKey("comment")) {
            String comment = value(columns, headerIndex, "comment");
            dto.setComment(comment == null || comment.isBlank() ? null : comment);
        }
        if (headerIndex.containsKey("expire_after_days")) {
            String expireRaw = value(columns, headerIndex, "expire_after_days");
            if (expireRaw != null && !expireRaw.isBlank()) {
                dto.setExpireAfterDays(parseLong(expireRaw, "INVALID_EXPIRE_DAYS"));
            }
        }
        if (headerIndex.containsKey("is_dangerous")) {
            String dangerousRaw = value(columns, headerIndex, "is_dangerous");
            if (dangerousRaw != null && !dangerousRaw.isBlank()) {
                dto.setDangerous(parseBoolean(dangerousRaw));
            }
        }
        return dto;
    }

    @Override
    protected void processDto(ItemDto dto) {
        itemService.createItemInternal(dto);
    }

    @Override
    protected ItemImportError createError(int lineNumber, String message, String rawLine) {
        return ItemImportError.builder()
                .lineNumber(lineNumber)
                .message(message)
                .rawLine(rawLine)
                .build();
    }

    @Override
    protected ItemImportReport createReport(int processedLines, int imported, List<ItemImportError> errors) {
        return ItemImportReport.builder()
                .processedLines(processedLines)
                .imported(imported)
                .errors(errors)
                .build();
    }
}
