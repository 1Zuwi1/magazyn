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
@Schema(description = "FIFO compliance check response")
public class OutboundCheckResponse {

    @Schema(description = "Whether the assortment is FIFO compliant (no older assortments exist)", example = "false")
    private boolean fifoCompliant;

    @Schema(description = "The requested assortment details")
    private OutboundPickSlot requestedAssortment;

    @Schema(description = "Older assortments that should be picked first (empty if FIFO compliant)")
    private List<OutboundPickSlot> olderAssortments;

    @Schema(description = "Warning message if not FIFO compliant", example = "3 older assortments of the same item exist and should be picked first")
    private String warning;
}
