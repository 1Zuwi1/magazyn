package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import com.github.dawid_stolarczyk.magazyn.Model.Enums.BackupResourceType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
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

    @NotBlank
    @Schema(description = "Cron expression for scheduling", example = "0 0 2 * * *")
    private String cronExpression;

    @NotEmpty
    @Schema(description = "Resource types to include in scheduled backups")
    private Set<BackupResourceType> resourceTypes;

    @Schema(description = "Whether the schedule is enabled", example = "true", defaultValue = "true")
    @Builder.Default
    private boolean enabled = true;
}
