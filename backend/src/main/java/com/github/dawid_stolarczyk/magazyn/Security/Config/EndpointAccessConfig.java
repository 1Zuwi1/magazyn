package com.github.dawid_stolarczyk.magazyn.Security.Config;

import com.github.dawid_stolarczyk.magazyn.Model.Enums.VerificationLevel;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Central configuration for endpoint access control based on verification levels.
 * Endpoints are matched in order - first match wins.
 */
@Component
public class EndpointAccessConfig {

    private final Map<String, VerificationLevel> endpointLevels = new LinkedHashMap<>();

    public EndpointAccessConfig() {
        // PUBLIC - no authentication required
        endpointLevels.put("/api/health", VerificationLevel.PUBLIC);
        endpointLevels.put("/api/auth/login", VerificationLevel.PUBLIC);
        endpointLevels.put("/api/auth/register", VerificationLevel.PUBLIC);
        endpointLevels.put("/api/auth/verify-email", VerificationLevel.PUBLIC);

        // AUTHENTICATED_UNVERIFIED - logged in but waiting for admin verification
        // Only basic auth endpoints to check status or logout
        endpointLevels.put("/api/auth/logout", VerificationLevel.AUTHENTICATED_UNVERIFIED);
        endpointLevels.put("/api/auth/me", VerificationLevel.AUTHENTICATED_UNVERIFIED);

        // VERIFIED_NO_2FA - admin verified, can configure 2FA
        endpointLevels.put("/api/2fa", VerificationLevel.VERIFIED_NO_2FA);
        endpointLevels.put("/api/webauthn/assertion", VerificationLevel.VERIFIED_NO_2FA);

        // FULLY_VERIFIED - default for all other endpoints
        // (handled in filter as fallback)
    }

    /**
     * Get required verification level for the given URI.
     * Returns null if endpoint should require FULLY_VERIFIED (default).
     */
    public VerificationLevel getRequiredLevel(String uri) {
        // Check exact matches and prefix matches
        for (Map.Entry<String, VerificationLevel> entry : endpointLevels.entrySet()) {
            if (uri.startsWith(entry.getKey())) {
                return entry.getValue();
            }
        }
        // Default: require full verification
        return VerificationLevel.FULLY_VERIFIED;
    }

    /**
     * Add or update an endpoint's required verification level.
     * Useful for dynamic configuration or testing.
     */
    public void setEndpointLevel(String pathPrefix, VerificationLevel level) {
        endpointLevels.put(pathPrefix, level);
    }
}
