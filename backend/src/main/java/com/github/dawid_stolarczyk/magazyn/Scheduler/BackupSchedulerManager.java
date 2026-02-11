package com.github.dawid_stolarczyk.magazyn.Scheduler;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.BackupSchedule;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Warehouse;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.BackupScheduleCode;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.BackupScheduleRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.WarehouseRepository;
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
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;

@Component
@Slf4j
public class BackupSchedulerManager {

    private final ThreadPoolTaskScheduler taskScheduler;
    private final BackupScheduleRepository backupScheduleRepository;
    private final WarehouseRepository warehouseRepository;
    private final BackupService backupService;
    private final ConcurrentHashMap<String, ScheduledFuture<?>> scheduledTasks = new ConcurrentHashMap<>();

    public BackupSchedulerManager(
            @Qualifier("backupTaskScheduler") ThreadPoolTaskScheduler taskScheduler,
            BackupScheduleRepository backupScheduleRepository,
            WarehouseRepository warehouseRepository,
            @Lazy BackupService backupService) {
        this.taskScheduler = taskScheduler;
        this.backupScheduleRepository = backupScheduleRepository;
        this.warehouseRepository = warehouseRepository;
        this.backupService = backupService;
    }

    @PostConstruct
    public void init() {
        List<Warehouse> allWarehouses = warehouseRepository.findAll();
        Optional<BackupSchedule> globalSchedule = backupScheduleRepository.findByGlobalTrue();

        for (Warehouse warehouse : allWarehouses) {
            if (globalSchedule.isPresent() && globalSchedule.get().isEnabled()) {
                registerScheduleForWarehouse(warehouse.getId(), "global", globalSchedule.get());
            }

            Optional<BackupSchedule> warehouseSchedule = backupScheduleRepository.findByWarehouseId(warehouse.getId());
            if (warehouseSchedule.isPresent() && warehouseSchedule.get().isEnabled()) {
                registerScheduleForWarehouse(warehouse.getId(), "specific", warehouseSchedule.get());
            }
        }
        log.info("Initialized backup schedules for {} warehouses", allWarehouses.size());
    }

    public void registerSchedule(BackupSchedule schedule) {
        if (schedule.isGlobal()) {
            List<Warehouse> allWarehouses = warehouseRepository.findAll();
            for (Warehouse warehouse : allWarehouses) {
                registerScheduleForWarehouse(warehouse.getId(), "global", schedule);
            }
            log.info("Registered global backup schedule");
        } else {
            registerScheduleForWarehouse(schedule.getWarehouse().getId(), "specific", schedule);
        }
    }

    private void registerScheduleForWarehouse(Long warehouseId, String scheduleType, BackupSchedule schedule) {
        String taskKey = getTaskKey(warehouseId, scheduleType);

        cancelTask(taskKey);

        if (!schedule.isEnabled()) {
            return;
        }

        try {
            scheduleCronSchedule(warehouseId, scheduleType, schedule);
        } catch (IllegalArgumentException e) {
            log.error("Invalid schedule configuration for warehouse {} ({}): code={}, hour={}, error={}",
                    warehouseId, scheduleType, schedule.getScheduleCode(), schedule.getBackupHour(), e.getMessage());
        }
    }

    private String getTaskKey(Long warehouseId, String scheduleType) {
        return warehouseId + ":" + scheduleType;
    }

    private void scheduleCronSchedule(Long warehouseId, String scheduleType, BackupSchedule schedule) {
        String cronExpression = buildCronExpression(schedule);
        CronTrigger trigger = new CronTrigger(cronExpression);
        ScheduledFuture<?> future = taskScheduler.schedule(
                () -> executeScheduledBackup(warehouseId, scheduleType, schedule),
                trigger
        );
        String taskKey = getTaskKey(warehouseId, scheduleType);
        scheduledTasks.put(taskKey, future);
        log.info("Registered cron backup schedule for warehouse {} ({}) - code: {}, hour: {}, cron: {}, global: {}",
                warehouseId, scheduleType, schedule.getScheduleCode(), schedule.getBackupHour(), cronExpression, schedule.isGlobal());
    }

    private String buildCronExpression(BackupSchedule schedule) {
        BackupScheduleCode code = schedule.getScheduleCode();
        Integer hour = schedule.getBackupHour();

        return switch (code) {
            case DAILY -> String.format("0 0 %d * * *", hour);
            case WEEKLY -> {
                Integer dayOfWeek = schedule.getDayOfWeek();
                if (dayOfWeek == null || dayOfWeek < 1 || dayOfWeek > 7) {
                    throw new IllegalArgumentException("dayOfWeek must be between1 and 7 for WEEKLY schedule");
                }
                String cronDay = java.time.DayOfWeek.of(dayOfWeek).name();
                yield String.format("0 0 %d ? * %s", hour, cronDay);
            }
            case MONTHLY -> {
                Integer dayOfMonth = schedule.getDayOfMonth();
                if (dayOfMonth == null || dayOfMonth < 1 || dayOfMonth > 31) {
                    dayOfMonth = 1;
                }
                if (dayOfMonth > 28) {
                    yield String.format("0 0 %d L * *", hour);
                }
                yield String.format("0 0 %d %d * *", hour, dayOfMonth);
            }
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
                Integer dayOfWeek = schedule.getDayOfWeek();
                if (dayOfWeek == null || dayOfWeek < 1 || dayOfWeek > 7) {
                    dayOfWeek = 7;
                }
                nextRun = nextRun.with(java.time.DayOfWeek.of(dayOfWeek));
                if (nextRun.isBefore(now) || nextRun.isEqual(now)) {
                    nextRun = nextRun.plusWeeks(1);
                }
                yield nextRun.atZone(zoneId).toInstant();
            }
            case MONTHLY -> {
                Integer dayOfMonth = schedule.getDayOfMonth();
                if (dayOfMonth == null || dayOfMonth < 1 || dayOfMonth > 31) {
                    dayOfMonth = 1;
                }
                int daysInMonth = now.withDayOfMonth(1).plusMonths(1).minusDays(1).getDayOfMonth();
                if (dayOfMonth > daysInMonth) {
                    dayOfMonth = daysInMonth;
                }
                nextRun = nextRun.withDayOfMonth(dayOfMonth);
                if (nextRun.isBefore(now) || nextRun.isEqual(now)) {
                    nextRun = nextRun.plusMonths(1);
                    daysInMonth = nextRun.withDayOfMonth(1).plusMonths(1).minusDays(1).getDayOfMonth();
                    if (schedule.getDayOfMonth() == 31) {
                        nextRun = nextRun.withDayOfMonth(daysInMonth);
                    }
                }
                yield nextRun.atZone(zoneId).toInstant();
            }
        };
    }

    public void cancelSchedule(Long warehouseId) {
        cancelTask(getTaskKey(warehouseId, "specific"));
        log.info("Cancelled specific backup schedule for warehouse {}", warehouseId);
    }

    public void cancelGlobalSchedule() {
        List<Warehouse> allWarehouses = warehouseRepository.findAll();
        for (Warehouse warehouse : allWarehouses) {
            cancelTask(getTaskKey(warehouse.getId(), "global"));
        }
        log.info("Cancelled global backup schedule");
    }

    private void cancelTask(String taskKey) {
        ScheduledFuture<?> existing = scheduledTasks.remove(taskKey);
        if (existing != null) {
            existing.cancel(false);
        }
    }

    private void executeScheduledBackup(Long warehouseId, String scheduleType, BackupSchedule schedule) {
        log.info("Executing scheduled backup for warehouse {} ({})", warehouseId, scheduleType);
        try {
            backupService.initiateScheduledBackup(warehouseId, schedule.getResourceTypeSet());
        } catch (Exception e) {
            log.error("Scheduled backup failed for warehouse {} ({})", warehouseId, scheduleType, e);
        } finally {
            BackupSchedule scheduleToUpdate = schedule;
            if (schedule.isGlobal()) {
                scheduleToUpdate = backupScheduleRepository.findByGlobalTrue().orElse(schedule);
            } else {
                scheduleToUpdate = backupScheduleRepository.findByWarehouseId(warehouseId).orElse(schedule);
            }
            scheduleToUpdate.setLastRunAt(Instant.now());
            scheduleToUpdate.setNextRunAt(calculateNextRunAt(schedule));
            backupScheduleRepository.save(scheduleToUpdate);
        }
    }

    @PreDestroy
    public void shutdown() {
        scheduledTasks.forEach((taskKey, future) -> future.cancel(false));
        scheduledTasks.clear();
        log.info("Shutdown all backup schedules");
    }
}
