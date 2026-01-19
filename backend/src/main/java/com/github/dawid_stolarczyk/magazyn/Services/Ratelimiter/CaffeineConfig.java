package com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bucket;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Configuration
public class CaffeineConfig {

    @Bean
    public Cache<String, Bucket> authRateLimitCache() {
        return Caffeine.newBuilder()
                .expireAfterAccess(15, TimeUnit.MINUTES)
                .maximumSize(100_000)
                .build();
    }
}
