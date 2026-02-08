package com.github.dawid_stolarczyk.magazyn.Scheduler;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.BackupSchedule;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.BackupScheduleRepository;
import com.github.dawid_stolarczyk.magazyn.Services.Backup.BackupService;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.scheduling.support.CronTrigger;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;

@Component
@Slf4j
public class BackupSchedulerManager {

    private final ThreadPoolTaskScheduler taskScheduler;
    private final BackupScheduleRepository backupScheduleRepository;
    private final BackupService backupService;
    private final ConcurrentHashMap<Long, ScheduledFuture<?>> scheduledTasks = new ConcurrentHashMap<>();

    public BackupSchedulerManager(
            @Qualifier("backupTaskScheduler") ThreadPoolTaskScheduler taskScheduler,
            BackupScheduleRepository backupScheduleRepository,
            @Lazy BackupService backupService) {
        this.taskScheduler = taskScheduler;
        this.backupScheduleRepository = backupScheduleRepository;
        this.backupService = backupService;
    }

    @PostConstruct
    public void init() {
        List<BackupSchedule> enabledSchedules = backupScheduleRepository.findByEnabledTrue();
        for (BackupSchedule schedule : enabledSchedules) {
            registerSchedule(schedule);
        }
        log.info("Initialized {} backup schedules", enabledSchedules.size());
    }

    public void registerSchedule(BackupSchedule schedule) {
        Long warehouseId = schedule.getWarehouse().getId();

        // Cancel existing schedule if any
        cancelSchedule(warehouseId);

        if (!schedule.isEnabled()) {
            return;
        }

        try {
            CronTrigger trigger = new CronTrigger(schedule.getCronExpression());
            ScheduledFuture<?> future = taskScheduler.schedule(
                    () -> executeScheduledBackup(schedule),
                    trigger
            );
            scheduledTasks.put(warehouseId, future);
            log.info("Registered backup schedule for warehouse {} with cron: {}",
                    warehouseId, schedule.getCronExpression());
        } catch (IllegalArgumentException e) {
            log.error("Invalid cron expression '{}' for warehouse {}: {}",
                    schedule.getCronExpression(), warehouseId, e.getMessage());
        }
    }

    public void cancelSchedule(Long warehouseId) {
        ScheduledFuture<?> existing = scheduledTasks.remove(warehouseId);
        if (existing != null) {
            existing.cancel(false);
            log.info("Cancelled backup schedule for warehouse {}", warehouseId);
        }
    }

    private void executeScheduledBackup(BackupSchedule schedule) {
        Long warehouseId = schedule.getWarehouse().getId();
        log.info("Executing scheduled backup for warehouse {}", warehouseId);
        try {
            backupService.initiateScheduledBackup(warehouseId, schedule.getResourceTypeSet());

            // Update lastRunAt
            schedule.setLastRunAt(java.time.Instant.now());
            backupScheduleRepository.save(schedule);
        } catch (Exception e) {
            log.error("Scheduled backup failed for warehouse {}", warehouseId, e);
        }
    }

    @PreDestroy
    public void shutdown() {
        scheduledTasks.forEach((warehouseId, future) -> future.cancel(false));
        scheduledTasks.clear();
        log.info("Shutdown all backup schedules");
    }
}
