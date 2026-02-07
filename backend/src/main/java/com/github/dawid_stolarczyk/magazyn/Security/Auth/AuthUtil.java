package com.github.dawid_stolarczyk.magazyn.Security.Auth;

import com.github.dawid_stolarczyk.magazyn.Common.Enums.AuthError;
import com.github.dawid_stolarczyk.magazyn.Exception.AuthenticationException;
import com.github.dawid_stolarczyk.magazyn.Exception.AuthenticationNotFoundException;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.Entity.AuthPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Utility class for managing authentication context and retrieving authenticated principal information.
 */
public class AuthUtil {
    /**
     * Retrieves the current authenticated principal from the SecurityContext.
     *
     * @return The {@link AuthPrincipal} of the current user.
     * @throws AuthenticationNotFoundException if no user is authenticated.
     * @throws AuthenticationException         if the authentication is invalid or incomplete.
     */
    public static AuthPrincipal getCurrentAuthPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            throw new AuthenticationNotFoundException();
        }

        Object principal = auth.getPrincipal();

        if (principal instanceof AuthPrincipal) {
            return (AuthPrincipal) principal;
        }

        throw new AuthenticationException(AuthError.NOT_AUTHENTICATED.name());
    }

    public static AuthPrincipal getCurrentAuthPrincipal(Authentication authentication) {
        assert authentication != null;
        Object principal = authentication.getPrincipal();

        if (principal instanceof AuthPrincipal) {
            return (AuthPrincipal) principal;
        }

        return null;
    }

    /**
     * Gets the current user's ID from the SecurityContext.
     *
     * @return the user ID, or null if not authenticated
     */
    public static Long getCurrentUserId() {
        try {
            AuthPrincipal principal = getCurrentAuthPrincipal();
            return principal != null ? principal.getUserId() : null;
        } catch (AuthenticationNotFoundException | AuthenticationException e) {
            return null;
        }
    }

    /**
     * Helper method to map authentication error codes to appropriate HTTP status.
     * Centralizes error mapping logic to ensure consistency across all controllers.
     *
     * @param errorCode The error code to map.
     * @return The corresponding {@link HttpStatus}.
     */
    public static HttpStatus getHttpStatusForAuthError(String errorCode) {
        if (errorCode == null) {
            return HttpStatus.INTERNAL_SERVER_ERROR;
        }

        // 403 Forbidden - insufficient permissions or restricted access
        if (AuthError.INSUFFICIENT_PERMISSIONS.name().equals(errorCode) ||
                AuthError.ACCESS_FORBIDDEN.name().equals(errorCode)) {
            return HttpStatus.FORBIDDEN;
        }

        // 404 Not Found - resource doesn't exist
        if (AuthError.RESOURCE_NOT_FOUND.name().equals(errorCode)) {
            return HttpStatus.NOT_FOUND;
        }

        // 400 Bad Request - validation errors and specific business logic failures
        if (AuthError.PASSKEY_NAME_ALREADY_EXISTS.name().equals(errorCode) ||
                AuthError.INVALID_INPUT.name().equals(errorCode) ||
                AuthError.TWO_FA_NOT_ENABLED.name().equals(errorCode) ||
                AuthError.UNSUPPORTED_2FA_METHOD.name().equals(errorCode) ||
                AuthError.EMAIL_TAKEN.name().equals(errorCode) ||
                AuthError.INVALID_PHONE_FORMAT.name().equals(errorCode) ||
                AuthError.INVALID_FULL_NAME.name().equals(errorCode)) {
            return HttpStatus.BAD_REQUEST;
        }

        // 401 Unauthorized - default for authentication issues
        return HttpStatus.UNAUTHORIZED;
    }
}
