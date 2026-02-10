package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Result of a backup restore operation")
public class RestoreResultDto {

    @Schema(description = "ID of the restored backup", example = "1")
    private Long backupId;

    @Schema(description = "Warehouse ID that was restored", example = "1")
    private Long warehouseId;

    @Schema(description = "Number of racks restored", example = "10")
    private int racksRestored;

    @Schema(description = "Number of items restored", example = "50")
    private int itemsRestored;

    @Schema(description = "Number of assortments restored", example = "200")
    private int assortmentsRestored;

    @Schema(description = "Timestamp of restore completion")
    private Instant restoredAt;
}
