package com.github.dawid_stolarczyk.magazyn.Security.Auth;

import com.github.dawid_stolarczyk.magazyn.Common.Enums.AuthError;
import com.github.dawid_stolarczyk.magazyn.Exception.AuthenticationException;
import com.github.dawid_stolarczyk.magazyn.Exception.AuthenticationNotFoundException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class AuthUtil {
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
}
