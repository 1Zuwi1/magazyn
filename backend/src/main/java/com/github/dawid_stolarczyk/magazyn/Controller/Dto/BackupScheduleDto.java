package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import com.github.dawid_stolarczyk.magazyn.Model.Enums.BackupResourceType;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.BackupScheduleCode;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Backup schedule information")
public class BackupScheduleDto {

    @Schema(description = "Warehouse ID", example = "1")
    private Long warehouseId;

    @Schema(description = "Warehouse name", example = "Main Warehouse")
    private String warehouseName;

    @Schema(description = "Backup schedule code", example = "DAILY")
    private BackupScheduleCode scheduleCode;

    @Schema(description = "Hour of day to run backup (0-23)", example = "2")
    private Integer backupHour;

    @Schema(description = "Resource types to include in scheduled backups")
    private Set<BackupResourceType> resourceTypes;

    @Schema(description = "Whether the schedule is enabled", example = "true")
    private boolean enabled;

    @Schema(description = "Last time this schedule ran")
    private Instant lastRunAt;

    @Schema(description = "Next scheduled run time")
    private Instant nextRunAt;
}
