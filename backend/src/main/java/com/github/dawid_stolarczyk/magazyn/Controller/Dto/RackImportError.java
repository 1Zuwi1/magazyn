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
public class RackImportError {
    @Schema(description = "Line number in the CSV file", example = "3")
    private int lineNumber;

    @Schema(description = "Error message", example = "INVALID_COLUMN_COUNT expected=12 actual=10")
    private String message;

    @Schema(description = "Raw line content", example = "A-01,1,,10,10,-20,25,1000,1.5,2.0,1.0,false")
    private String rawLine;
}
