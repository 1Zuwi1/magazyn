package com.github.dawid_stolarczyk.magazyn.Config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Configuration
public class BackupSchedulerConfig {

    @Value("${app.backup.scheduler-pool-size:10}")
    private int schedulerPoolSize;

    @Value("${app.backup.streaming-pool-size:8}")
    private int streamingPoolSize;

    @Bean(name = "backupTaskScheduler")
    public ThreadPoolTaskScheduler backupTaskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(schedulerPoolSize);
        scheduler.setThreadNamePrefix("backup-scheduler-");
        scheduler.setWaitForTasksToCompleteOnShutdown(true);
        scheduler.setAwaitTerminationSeconds(60);
        scheduler.initialize();
        return scheduler;
    }

    @Bean(name = "backupStreamingExecutor")
    public ExecutorService backupStreamingExecutor() {
        return Executors.newFixedThreadPool(streamingPoolSize, r -> {
            Thread thread = new Thread(r);
            thread.setName("backup-stream-" + thread.getId());
            thread.setDaemon(true);
            return thread;
        });
    }
}
