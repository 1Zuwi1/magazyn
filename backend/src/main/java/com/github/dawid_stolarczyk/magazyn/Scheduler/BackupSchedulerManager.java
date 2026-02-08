package com.github.dawid_stolarczyk.magazyn.Scheduler;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.BackupSchedule;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.BackupScheduleCode;
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

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
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
            String cronExpression = buildCronExpression(schedule.getScheduleCode(), schedule.getBackupHour());
            CronTrigger trigger = new CronTrigger(cronExpression);
            ScheduledFuture<?> future = taskScheduler.schedule(
                    () -> executeScheduledBackup(schedule),
                    trigger
            );
            scheduledTasks.put(warehouseId, future);
            log.info("Registered backup schedule for warehouse {} - code: {}, hour: {}, cron: {}",
                    warehouseId, schedule.getScheduleCode(), schedule.getBackupHour(), cronExpression);
        } catch (IllegalArgumentException e) {
            log.error("Invalid schedule configuration for warehouse {}: code={}, hour={}, error={}",
                    warehouseId, schedule.getScheduleCode(), schedule.getBackupHour(), e.getMessage());
        }
    }

    private String buildCronExpression(BackupScheduleCode code, Integer hour) {
        return switch (code) {
            case DAILY -> String.format("0 0 %d * * *", hour);
            case WEEKLY -> String.format("0 0 %d ? * SUN", hour);
            case MONTHLY -> String.format("0 0 %d 1 * *", hour);
        };
    }

    private Instant calculateNextRunAt(BackupSchedule schedule) {
        ZoneId zoneId = ZoneId.systemDefault();
        LocalDateTime now = LocalDateTime.now(zoneId);
        LocalDateTime nextRun = now.withHour(schedule.getBackupHour()).withMinute(0).withSecond(0);

        return switch (schedule.getScheduleCode()) {
            case DAILY -> {
                if (nextRun.isBefore(now) || nextRun.isEqual(now)) {
                    nextRun = nextRun.plusDays(1);
                }
                yield nextRun.atZone(zoneId).toInstant();
            }
            case WEEKLY -> {
                if (nextRun.isBefore(now) || nextRun.isEqual(now)) {
                    nextRun = nextRun.plusWeeks(1);
                }
                nextRun = nextRun.with(java.time.DayOfWeek.SUNDAY);
                yield nextRun.atZone(zoneId).toInstant();
            }
            case MONTHLY -> {
                if (nextRun.isBefore(now) || nextRun.isEqual(now)) {
                    nextRun = nextRun.plusMonths(1);
                }
                nextRun = nextRun.withDayOfMonth(1);
                yield nextRun.atZone(zoneId).toInstant();
            }
        };
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

            // Update lastRunAt and nextRunAt
            schedule.setLastRunAt(Instant.now());
            schedule.setNextRunAt(calculateNextRunAt(schedule));
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
