package com.github.dawid_stolarczyk.magazyn.Security.Auth.Entity;

import com.github.dawid_stolarczyk.magazyn.Model.Enums.ApiKeyScope;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.Set;

/**
 * Security principal for API key-authenticated requests.
 * Stored in SecurityContext similar to AuthPrincipal for session-based auth.
 */
@Getter
@AllArgsConstructor
public class ApiKeyPrincipal {
    private final Long apiKeyId;
    private final String apiKeyName;
    private final Long warehouseId;
    private final Set<ApiKeyScope> scopes;

    public boolean hasScope(ApiKeyScope scope) {
        return scopes != null && scopes.contains(scope);
    }

    public boolean isGlobalAccess() {
        return warehouseId == null;
    }
}
