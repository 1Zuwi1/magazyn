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
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private UserRepository userRepository;

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        logger.info("Filtering request: {}", path);
        String jwt = CookiesUtils.getCookie(request, "jwt_token");
        System.out.println("JWT from cookie: " + jwt);

        if (jwt != null) {

            Long userId = jwtUtil.extractUserId(jwt);
            System.out.println("Extracted userId from JWT: " + userId);
            User user = userRepository.findById(userId).orElse(null);
            if (user != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                String status2FA = jwtUtil.extract2FaStatus(jwt);
                Status2FA status = status2FA != null ? Status2FA.valueOf(status2FA) : Status2FA.PRE_2FA;

                List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
                authorities.add(new SimpleGrantedAuthority("STATUS_2FA_" + status.name()));

                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(userId, null, authorities);
                SecurityContextHolder.getContext().setAuthentication(authToken);

                long remainingMillis = jwtUtil.extractExpiration(jwt).getTime() - System.currentTimeMillis();
                System.out.println("JWT remaining time (min): " + remainingMillis / 60000);
                if (remainingMillis <= 40 * 60 * 1000) {
                    System.out.println("Refreshing JWT token for userId: " + userId);
                    String newToken = jwtUtil.generateToken(userId, status);
                    CookiesUtils.setCookie(response, "token", newToken, null);
                }
            }
        }
        filterChain.doFilter(request, response);

    }
}
