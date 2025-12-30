package com.github.dawid_stolarczyk.magazyn.Model.Security;

import com.github.dawid_stolarczyk.magazyn.Model.Entities.User;
import com.github.dawid_stolarczyk.magazyn.Model.Repositories.UserRepository;
import com.github.dawid_stolarczyk.magazyn.Model.Utils.CookiesUtils;
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
import java.util.Date;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private static final long REFRESH_THRESHOLD_MILLIS = 40 * 60 * 1000; // 40 minutes
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
        String jwt = CookiesUtils.getCookie(request, "token");
        logger.info("JWT from cookie: {}", jwt);

        if (jwt != null) {

            Long userId = jwtUtil.extractUserId(jwt);
            logger.info("Extracted userId from JWT: {}", userId);
            User user = userRepository.findById(userId).orElse(null);
            if (user != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                String status2FA = jwtUtil.extract2FaStatus(jwt);
                Status2FA status = status2FA != null ? Status2FA.valueOf(status2FA) : Status2FA.PRE_2FA;

                List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
                authorities.add(new SimpleGrantedAuthority("STATUS_2FA_" + status.name()));

                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(userId, null,
                        authorities);
                SecurityContextHolder.getContext().setAuthentication(authToken);

                Date expirationTime = jwtUtil.extractExpiration(jwt);
                if (expirationTime == null) {
                    logger.warn("Expiration time is null for JWT of userId: {}", userId);
                    return;
                }
                long remainingMillis = expirationTime.getTime() - System.currentTimeMillis();

                logger.info("JWT remaining time (min): {}", remainingMillis / 60000);
                if (remainingMillis <= REFRESH_THRESHOLD_MILLIS) {
                    logger.info("Refreshing JWT token for userId: {}", userId);
                    String newToken = jwtUtil.generateToken(userId, status);
                    CookiesUtils.setCookie(response, "token", newToken, null);
                }
            }
        }
        filterChain.doFilter(request, response);

    }
}
