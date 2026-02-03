package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseImportError {
    @Schema(description = "Line number in the CSV file", example = "2")
    private int lineNumber;

    @Schema(description = "Error message", example = "INVALID_NAME")
    private String message;

    @Schema(description = "Raw line content", example = "WH-1")
    private String rawLine;
}
