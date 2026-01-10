package com.github.dawid_stolarczyk.magazyn.Security.Filter;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.Status2FA;
import com.github.dawid_stolarczyk.magazyn.Repositories.UserRepository;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.AuthPrincipal;
import com.github.dawid_stolarczyk.magazyn.Security.JwtUtil;
import com.github.dawid_stolarczyk.magazyn.Utils.CookiesUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        logger.info("Filtering request: {}", path);
        String jwt = CookiesUtils.getCookie(request, "access-token");

        if (jwt != null) {

            Long userId = jwtUtil.extractUserId(jwt);
            logger.info("Extracted userId from JWT: {}", userId);
            User user = userRepository.findById(userId).orElse(null);
            if (user != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                String status2FA = jwtUtil.extract2FaStatus(jwt);
                Status2FA status = status2FA != null ? Status2FA.valueOf(status2FA) : Status2FA.PRE_2FA;

                List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));

                AuthPrincipal principal = new AuthPrincipal(userId, status);
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(principal, null,
                        authorities);
                SecurityContextHolder.getContext().setAuthentication(authToken);
                logger.info("logownie powiodło się dla użytkownika o ID: {}", userId);
            }
        }
        filterChain.doFilter(request, response);

    }
}
