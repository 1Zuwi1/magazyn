package com.github.dawid_stolarczyk.magazyn.Model.Entity;

import com.github.dawid_stolarczyk.magazyn.Model.Enums.BackupResourceType;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.BackupScheduleCode;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

@Entity
@Table(name = "backup_schedules", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"warehouse_id"}, name = "uk_backup_schedule_warehouse")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BackupSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Enumerated(EnumType.STRING)
    @Column(name = "schedule_code", nullable = false, length = 20)
    private BackupScheduleCode scheduleCode;

    @Column(name = "backup_hour", nullable = false)
    private Integer backupHour;

    @Column(name = "resource_types", nullable = false)
    private String resourceTypes;

    @Column(nullable = false)
    @Builder.Default
    private boolean enabled = true;

    @Column(name = "last_run_at")
    private Instant lastRunAt;

    @Column(name = "next_run_at")
    private Instant nextRunAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public Set<BackupResourceType> getResourceTypeSet() {
        if (resourceTypes == null || resourceTypes.isBlank()) {
            return Collections.emptySet();
        }
        return Arrays.stream(resourceTypes.split(","))
                .map(String::trim)
                .map(BackupResourceType::valueOf)
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
