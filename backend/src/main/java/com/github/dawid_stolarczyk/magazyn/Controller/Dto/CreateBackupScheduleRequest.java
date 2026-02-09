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

    @Min(value = 1, message = "Day of week must be between 1 (Monday) and 7 (Sunday)")
    @Max(value = 7, message = "Day of week must be between 1 (Monday) and 7 (Sunday)")
    @Schema(description = "Day of week for WEEKLY schedule (1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun)", example = "1")
    private Integer dayOfWeek;

    @Min(value = 1, message = "Day of month must be between 1 and 31")
    @Max(value = 31, message = "Day of month must be between 1 and 31")
    @Schema(description = "Day of month for MONTHLY schedule (1-31). If set to 31, backup runs on last day of month for months with fewer days.", example = "1")
    private Integer dayOfMonth;

    @NotEmpty
    @Schema(description = "Resource types to include in scheduled backups")
    private Set<BackupResourceType> resourceTypes;

    @Schema(description = "Whether the schedule is enabled", example = "true", defaultValue = "true")
    @Builder.Default
    private boolean enabled = true;
}
