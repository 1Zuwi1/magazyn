package com.github.dawid_stolarczyk.magazyn.Controller.Backup;

import com.github.dawid_stolarczyk.magazyn.Common.ConfigurationConstants;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.*;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.UserRepository;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.AuthUtil;
import com.github.dawid_stolarczyk.magazyn.Services.Backup.BackupService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/backups")
@Tag(name = "Backup Management", description = "Endpoints for managing encrypted backups and schedules")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Slf4j
public class BackupController {

    private final BackupService backupService;
    private final UserRepository userRepository;

    @Operation(summary = "Create a manual backup",
            description = "Initiates an async encrypted backup for the specified warehouse and resource types")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "202", description = "Backup initiated"),
            @ApiResponse(responseCode = "400", description = "Error codes: WAREHOUSE_NOT_FOUND, BACKUP_ALREADY_IN_PROGRESS",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping
    public ResponseEntity<ResponseTemplate<BackupRecordDto>> createBackup(
            @Valid @RequestBody CreateBackupRequest request,
            HttpServletRequest httpRequest) {
        User currentUser = resolveCurrentUser();
        BackupRecordDto dto = backupService.initiateBackup(request, currentUser, httpRequest);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(ResponseTemplate.success(dto));
    }

    @Operation(summary = "List backups with pagination",
            description = "Returns paginated list of backup records, optionally filtered by warehouse")
    @ApiResponse(responseCode = "200", description = "Success",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = ResponseTemplate.PagedBackupRecordsResponse.class)))
    @GetMapping
    public ResponseEntity<ResponseTemplate<PagedResponse<BackupRecordDto>>> listBackups(
            @Parameter(description = "Filter by warehouse ID") @RequestParam(required = false) Long warehouseId,
            @Parameter(description = "Page number (0-indexed)", example = "0") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size", example = "20") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort by field", example = "createdAt") @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "Sort direction (asc/desc)", example = "desc") @RequestParam(defaultValue = "desc") String sortDir,
            HttpServletRequest httpRequest) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        PageRequest pageable = PageRequest.of(page, Math.min(size, ConfigurationConstants.MAX_PAGE_SIZE), sort);
        return ResponseEntity.ok(ResponseTemplate.success(
                backupService.getBackups(warehouseId, pageable, httpRequest)));
    }

    @Operation(summary = "Get backup by ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success"),
            @ApiResponse(responseCode = "400", description = "Error codes: BACKUP_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<ResponseTemplate<BackupRecordDto>> getBackup(
            @PathVariable Long id,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ResponseTemplate.success(backupService.getBackup(id, httpRequest)));
    }

    @Operation(summary = "Restore from backup",
            description = "Restores warehouse data from a completed backup. This is an async operation.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "202", description = "Restore initiated"),
            @ApiResponse(responseCode = "400", description = "Error codes: BACKUP_NOT_FOUND, BACKUP_NOT_COMPLETED, RESTORE_ALREADY_IN_PROGRESS",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping("/{id}/restore")
    public ResponseEntity<ResponseTemplate<RestoreResultDto>> restoreBackup(@PathVariable Long id) {
        RestoreResultDto dto = backupService.restoreBackup(id);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(ResponseTemplate.success(dto));
    }

    @Operation(summary = "Delete a backup",
            description = "Deletes backup files from R2 storage and the database record")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Backup deleted"),
            @ApiResponse(responseCode = "400", description = "Error codes: BACKUP_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<ResponseTemplate<Void>> deleteBackup(
            @PathVariable Long id,
            HttpServletRequest httpRequest) {
        backupService.deleteBackup(id, httpRequest);
        return ResponseEntity.ok(ResponseTemplate.success());
    }

    @Operation(summary = "List all backup schedules")
    @GetMapping("/schedules")
    public ResponseEntity<ResponseTemplate<List<BackupScheduleDto>>> listSchedules() {
        return ResponseEntity.ok(ResponseTemplate.success(backupService.getAllSchedules()));
    }

    @Operation(summary = "Create or update a backup schedule for a warehouse",
            description = "Upserts a backup schedule. Each warehouse can have at most one schedule.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Schedule created/updated"),
            @ApiResponse(responseCode = "400", description = "Error codes: WAREHOUSE_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PutMapping("/schedules/{warehouseId}")
    public ResponseEntity<ResponseTemplate<BackupScheduleDto>> upsertSchedule(
            @PathVariable Long warehouseId,
            @Valid @RequestBody CreateBackupScheduleRequest request) {
        return ResponseEntity.ok(ResponseTemplate.success(
                backupService.upsertSchedule(warehouseId, request)));
    }

    @Operation(summary = "Delete a backup schedule for a warehouse")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Schedule deleted"),
            @ApiResponse(responseCode = "400", description = "Error codes: SCHEDULE_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @DeleteMapping("/schedules/{warehouseId}")
    public ResponseEntity<ResponseTemplate<Void>> deleteSchedule(@PathVariable Long warehouseId) {
        backupService.deleteSchedule(warehouseId);
        return ResponseEntity.ok(ResponseTemplate.success());
    }

    @Operation(summary = "Backup all warehouses",
            description = "Initiates async encrypted backups for all warehouses with all resource types (racks, items, assortments)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "202", description = "Backups initiated for all warehouses"),
            @ApiResponse(responseCode = "400", description = "Error codes: NO_WAREHOUSES_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping("/backup-all")
    public ResponseEntity<ResponseTemplate<List<BackupRecordDto>>> backupAllWarehouses(
            HttpServletRequest httpRequest) {
        User currentUser = resolveCurrentUser();
        List<BackupRecordDto> dtos = backupService.backupAllWarehouses(currentUser, httpRequest);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(ResponseTemplate.success(dtos));
    }

    @Operation(summary = "Restore all warehouses",
            description = "Restores all warehouses from their latest completed backup")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "202", description = "Restores initiated for all warehouses"),
            @ApiResponse(responseCode = "400", description = "Error codes: NO_WAREHOUSES_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping("/restore-all")
    public ResponseEntity<ResponseTemplate<List<RestoreResultDto>>> restoreAllWarehouses(
            HttpServletRequest httpRequest) {
        List<RestoreResultDto> dtos = backupService.restoreAllWarehouses(httpRequest);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(ResponseTemplate.success(dtos));
    }

    private User resolveCurrentUser() {
        try {
            Long userId = AuthUtil.getCurrentUserId();
            if (userId != null) {
                return userRepository.findById(userId).orElse(null);
            }
        } catch (Exception e) {
            log.warn("Failed to resolve current user: {}", e.getMessage());
        }
        return null;
    }
}
