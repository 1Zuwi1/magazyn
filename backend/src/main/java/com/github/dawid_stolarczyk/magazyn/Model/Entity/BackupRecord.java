package com.github.dawid_stolarczyk.magazyn.Model.Entity;

import com.github.dawid_stolarczyk.magazyn.Model.Enums.BackupResourceType;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.BackupStatus;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.BackupType;
import jakarta.persistence.*;
import lombok.*;
import lombok.extern.slf4j.Slf4j;

import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Entity
@Table(name = "backup_records", indexes = {
        @Index(name = "idx_backup_records_warehouse_id", columnList = "warehouse_id"),
        @Index(name = "idx_backup_records_status", columnList = "status"),
        @Index(name = "idx_backup_records_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Slf4j
public class BackupRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Enumerated(EnumType.STRING)
    @Column(name = "backup_type", nullable = false, length = 20)
    private BackupType backupType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private BackupStatus status = BackupStatus.IN_PROGRESS;

    @Column(name = "resource_types", nullable = false)
    private String resourceTypes;

    @Column(name = "r2_base_path", length = 500)
    private String r2BasePath;

    @Column(name = "total_records")
    private Integer totalRecords;

    @Column(name = "size_bytes")
    private Long sizeBytes;

    @Column(name = "backup_progress_percentage")
    private Integer backupProgressPercentage;

    @Column(name = "restore_progress_percentage")
    private Integer restoreProgressPercentage;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "error_message", length = 2000)
    private String errorMessage;

    @Column(name = "restore_started_at")
    private Instant restoreStartedAt;

    @Column(name = "restore_completed_at")
    private Instant restoreCompletedAt;

    @Column(name = "racks_restored")
    private Integer racksRestored;

    @Column(name = "items_restored")
    private Integer itemsRestored;

    @Column(name = "assortments_restored")
    private Integer assortmentsRestored;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "triggered_by")
    private User triggeredBy;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public Set<BackupResourceType> getResourceTypeSet() {
        if (resourceTypes == null || resourceTypes.isBlank()) {
            return Collections.emptySet();
        }
        return Arrays.stream(resourceTypes.split(","))
                .map(String::trim)
                .map(s -> {
                    try {
                        return BackupResourceType.valueOf(s);
                    } catch (IllegalArgumentException e) {
                        log.warn("Invalid BackupResourceType '{}' in backup record {}, ignoring", s, id);
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }

    public void setResourceTypeSet(Set<BackupResourceType> types) {
        if (types == null || types.isEmpty()) {
            this.resourceTypes = "";
            return;
        }
        this.resourceTypes = types.stream()
                .map(BackupResourceType::name)
                .sorted()
                .collect(Collectors.joining(","));
    }
}
