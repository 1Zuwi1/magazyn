package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import com.github.dawid_stolarczyk.magazyn.Model.Enums.BackupResourceType;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.BackupScheduleCode;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to create or update a backup schedule")
public class CreateBackupScheduleRequest {

    @NotNull
    @Schema(description = "Backup schedule code", example = "DAILY")
    private BackupScheduleCode scheduleCode;

    @NotNull
    @Min(value = 0, message = "Backup hour must be between 0 and 23")
    @Max(value = 23, message = "Backup hour must be between 0 and 23")
    @Schema(description = "Hour of day to run backup (0-23)", example = "2")
    private Integer backupHour;

    @NotEmpty
    @Schema(description = "Resource types to include in scheduled backups")
    private Set<BackupResourceType> resourceTypes;

    @Schema(description = "Whether the schedule is enabled", example = "true", defaultValue = "true")
    @Builder.Default
    private boolean enabled = true;
}
