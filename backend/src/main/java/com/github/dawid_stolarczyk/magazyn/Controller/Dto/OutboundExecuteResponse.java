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
@Schema(description = "Outbound operation execution response")
public class OutboundExecuteResponse {

    @Schema(description = "Number of assortments issued", example = "3")
    private int issuedCount;

    @Schema(description = "Audit records for each issued assortment")
    private List<OutboundOperationDto> operations;
}
