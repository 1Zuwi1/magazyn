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
public class ItemImportError {
    @Schema(description = "Line number in the CSV file", example = "3")
    private int lineNumber;

    @Schema(description = "Error message", example = "INVALID_COLUMN_COUNT expected=10 actual=8")
    private String message;

    @Schema(description = "Raw line content", example = "Laptop,5.0,25.0,1.5,0.5,0.3,0.2,30,false")
    private String rawLine;
}
