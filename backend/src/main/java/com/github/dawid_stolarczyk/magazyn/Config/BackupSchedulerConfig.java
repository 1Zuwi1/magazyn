package com.github.dawid_stolarczyk.magazyn.Config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Configuration
public class BackupSchedulerConfig {

    @Bean(name = "backupTaskScheduler")
    public ThreadPoolTaskScheduler backupTaskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(2);
        scheduler.setThreadNamePrefix("backup-scheduler-");
        scheduler.setWaitForTasksToCompleteOnShutdown(true);
        scheduler.setAwaitTerminationSeconds(60);
        scheduler.initialize();
        return scheduler;
    }

    @Bean(name = "backupStreamingExecutor")
    public ExecutorService backupStreamingExecutor() {
        return Executors.newFixedThreadPool(4, r -> {
            Thread thread = new Thread(r);
            thread.setName("backup-stream-" + thread.getId());
            thread.setDaemon(true);
            return thread;
        });
    }
}
