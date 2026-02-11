package com.github.dawid_stolarczyk.magazyn.Security.Filter;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.ApiKey;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.ApiKeyRepository;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.Entity.ApiKeyPrincipal;
import com.github.dawid_stolarczyk.magazyn.Services.ApiKeyBatchUpdateService;
import com.github.dawid_stolarczyk.magazyn.Utils.Hasher;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Filter that authenticates requests via the X-API-KEY header.
 * Runs before SessionAuthFilter — if an API key is present and valid,
 * it sets the SecurityContext with an ApiKeyPrincipal and scope-based authorities.
 * If no X-API-KEY header is present, the filter passes through to session auth.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ApiKeyAuthFilter extends OncePerRequestFilter {

    private static final String API_KEY_HEADER = "X-API-KEY";
    private static final int UPDATE_THRESHOLD = 10;
    private static final long BATCH_UPDATE_INTERVAL_SECONDS = 30;

    private final ApiKeyRepository apiKeyRepository;
    private final ApiKeyBatchUpdateService batchUpdateService;
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
    private final Map<Long, AtomicInteger> usageCounters = new ConcurrentHashMap<>();
    private final Map<Long, Instant> pendingUpdates = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        scheduler.scheduleAtFixedRate(this::flushPendingUpdates, BATCH_UPDATE_INTERVAL_SECONDS, BATCH_UPDATE_INTERVAL_SECONDS, TimeUnit.SECONDS);
    }

    @PreDestroy
    public void cleanup() {
        scheduler.shutdown();
        flushPendingUpdates();
    }

    private void flushPendingUpdates() {
        if (pendingUpdates.isEmpty()) {
            return;
        }

        Map<Long, Instant> updatesToFlush;
        synchronized (this) {
            if (pendingUpdates.isEmpty()) {
                return;
            }
            updatesToFlush = new ConcurrentHashMap<>(pendingUpdates);
            pendingUpdates.clear();
            usageCounters.clear();
        }

        batchUpdateService.batchUpdateLastUsedAt(updatesToFlush);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String rawKey = request.getHeader(API_KEY_HEADER);

        if (rawKey == null || rawKey.isBlank()) {
            request.getSession().invalidate();
            filterChain.doFilter(request, response);
            return;
        }

        String keyHash = Hasher.hashSHA256(rawKey);
        ApiKey apiKey = apiKeyRepository.findByKeyHash(keyHash).orElse(null);

        if (apiKey == null || !apiKey.isActive()) {
            log.warn("Invalid or inactive API key attempt from IP: {}", request.getRemoteAddr());
            request.getSession().invalidate();
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid or inactive API key");
            return;
        }

        long apiKeyId = apiKey.getId();
        Instant now = Instant.now();

        usageCounters.computeIfAbsent(apiKeyId, k -> new AtomicInteger(0)).incrementAndGet();

        if (usageCounters.get(apiKeyId).get() >= UPDATE_THRESHOLD) {
            pendingUpdates.put(apiKeyId, now);
            usageCounters.remove(apiKeyId);
        }

        if (!pendingUpdates.containsKey(apiKeyId)) {
            pendingUpdates.put(apiKeyId, now);
        }

        List<SimpleGrantedAuthority> authorities = apiKey.getScopes().stream()
                .map(scope -> new SimpleGrantedAuthority("SCOPE_" + scope.name()))
                .toList();

        ApiKeyPrincipal principal = new ApiKeyPrincipal(
                apiKey.getId(),
                apiKey.getName(),
                apiKey.getWarehouseId(),
                apiKey.getScopes()
        );

        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(principal, null, authorities);
        SecurityContextHolder.getContext().setAuthentication(auth);

        log.debug("API key authenticated: name={}, scopes={}", apiKey.getName(), apiKey.getScopes());

        filterChain.doFilter(request, response);
    }
}
