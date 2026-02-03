package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemImportReport {
    @Schema(description = "Total number of non-empty, non-comment lines processed", example = "5")
    private int processedLines;

    @Schema(description = "Number of successfully imported items", example = "4")
    private int imported;

    @Schema(description = "List of errors encountered during import")
    private List<ItemImportError> errors;
}
