package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import com.github.dawid_stolarczyk.magazyn.Model.Enums.BackupResourceType;
import io.swagger.v3.oas.annotations.media.Schema;
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
@Schema(description = "Request to create a manual backup")
public class CreateBackupRequest {

    @NotNull
    @Schema(description = "Warehouse ID to back up", example = "1")
    private Long warehouseId;

    @NotEmpty
    @Schema(description = "Resource types to include in backup")
    private Set<BackupResourceType> resourceTypes;
}
