package com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;
import java.util.EnumMap;
import java.util.Map;

@ConfigurationProperties(prefix = "auth")
@Getter
@Setter
public class AuthRateLimitProperties {

    private Map<RateLimitOperation, Limit> limits = new EnumMap<>(RateLimitOperation.class);

    @Getter
    @Setter
    public static class Limit {
        private long capacity;
        private long refill;
        private Duration duration;
    }
}
