package com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.dawid_stolarczyk.magazyn.Exception.RateLimitExceededException;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class Bucket4jRateLimiter implements RateLimiter {

    @Autowired
    private Cache<String, Bucket> cache;
    @Autowired
    private AuthRateLimitProperties properties;

    @Override
    public void consumeOrThrow(String key, RateLimitOperation op) {
        if (key == null || key.isEmpty()) {
            throw new IllegalArgumentException("Key must not be null or empty");
        }
        if (op == null) {
            throw new IllegalArgumentException("RateLimitOperation must not be null");
        }
        Bucket bucket = cache.get(cacheKey(key, op),
                k -> createBucket(op));

        assert bucket != null;
        if (!bucket.tryConsume(1)) {
            throw new RateLimitExceededException(op.name());
        }
    }

    private Bucket createBucket(RateLimitOperation op) {
        var limit = properties.getLimits().get(op);

        return Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(limit.getCapacity())
                        .refillGreedy(limit.getRefill(), limit.getDuration())
                        .build())
                .build();
    }

    private String cacheKey(String key, RateLimitOperation op) {
        return key + ":" + op.name();
    }
}
