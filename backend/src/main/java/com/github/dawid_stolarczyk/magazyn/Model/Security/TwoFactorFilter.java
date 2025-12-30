package com.github.dawid_stolarczyk.magazyn.Model.Security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Objects;

@Component
public class TwoFactorFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth != null && auth.isAuthenticated()) {
            boolean verified2FA = auth.getAuthorities().stream()
                    .anyMatch(a -> Objects.equals(a.getAuthority(), "STATUS_2FA_VERIFIED"));

            if (!verified2FA
                    && !request.getRequestURI().startsWith("/api/2fa")
                    && !request.getRequestURI().startsWith("/api/auth")
                    && !request.getRequestURI().startsWith("/api/health")) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write("2FA not verified");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
