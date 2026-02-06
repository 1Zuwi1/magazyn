package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to execute outbound operation (issue items from positions)")
public class OutboundExecuteRequest {

    @NotEmpty
    @Valid
    @Schema(description = "List of positions to pick (rackId, x, y)")
    private List<OutboundPickPosition> positions;

    @Builder.Default
    @Schema(description = "Skip FIFO validation (default false). When true, allows picking non-FIFO items but records fifoCompliant=false in audit.", example = "false")
    private boolean skipFifo = false;
}
