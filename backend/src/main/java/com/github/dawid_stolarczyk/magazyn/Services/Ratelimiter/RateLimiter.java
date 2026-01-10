package com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter;

public interface RateLimiter {
    void consumeOrThrow(String key, RateLimitOperation op);
}
