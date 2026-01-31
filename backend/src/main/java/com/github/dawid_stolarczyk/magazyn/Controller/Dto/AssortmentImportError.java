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
public class AssortmentImportError {
    @Schema(description = "Line number in the CSV file", example = "3")
    private int lineNumber;

    @Schema(description = "Error message", example = "INVALID_ITEM_ID")
    private String message;

    @Schema(description = "Raw line content", example = "1,2,3,4,2026-12-31")
    private String rawLine;
}
