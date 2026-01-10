package com.github.dawid_stolarczyk.magazyn.Security.Filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ResponseTemplate;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.Status2FA;
import com.github.dawid_stolarczyk.magazyn.Security.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Objects;

@Component
public class TwoFactorFilter extends OncePerRequestFilter {
    private List<String> whitelist = List.of("/api/2fa", "/api/auth", "/api/health");
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth != null && auth.isAuthenticated()) {
            boolean verified2FA = Objects.requireNonNull(JwtUtil.getCurrentAuthPrincipal(auth)).getStatus2FA().equals(Status2FA.VERIFIED);

            boolean isWhitelisted = whitelist.stream()
                    .anyMatch(path -> request.getRequestURI().startsWith(path));
            if (!verified2FA
                    && !isWhitelisted) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");

                objectMapper.writeValue(response.getWriter(), new ResponseTemplate<>(false, "2FA_NOT_VERIFIED", null));
            }
        }

        filterChain.doFilter(request, response);
    }
}
