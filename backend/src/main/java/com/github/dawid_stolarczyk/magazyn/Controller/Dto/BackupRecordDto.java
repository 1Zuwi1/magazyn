package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import com.github.dawid_stolarczyk.magazyn.Model.Enums.BackupResourceType;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.BackupStatus;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.BackupType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Backup record information")
public class BackupRecordDto {

    @Schema(description = "Backup record ID", example = "1")
    private Long id;

    @Schema(description = "Warehouse ID", example = "1")
    private Long warehouseId;

    @Schema(description = "Warehouse name", example = "Main Warehouse")
    private String warehouseName;

    @Schema(description = "Backup type", example = "MANUAL")
    private BackupType backupType;

    @Schema(description = "Backup status", example = "COMPLETED")
    private BackupStatus status;

    @Schema(description = "Resource types included in backup")
    private List<BackupResourceType> resourceTypes;

    @Schema(description = "Total number of records backed up", example = "150")
    private Integer totalRecords;

    @Schema(description = "Total size of backup in bytes", example = "524288")
    private Long sizeBytes;

    @Schema(description = "Backup creation timestamp")
    private Instant createdAt;

    @Schema(description = "Backup completion timestamp")
    private Instant completedAt;

    @Schema(description = "Error message if backup failed")
    private String errorMessage;

    @Schema(description = "Name of user who triggered the backup")
    private String triggeredByName;
}
