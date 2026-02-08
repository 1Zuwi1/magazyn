package com.github.dawid_stolarczyk.magazyn.Security.Filter;

import com.github.dawid_stolarczyk.magazyn.Common.Enums.AuthError;
import com.github.dawid_stolarczyk.magazyn.Exception.AuthenticationException;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AccountStatus;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.EmailStatus;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.Status2FA;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.UserRepository;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.Entity.AuthPrincipal;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.Entity.SessionData;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.Entity.TwoFactorAuth;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.Redis.SessionService;
import com.github.dawid_stolarczyk.magazyn.Security.SessionManager;
import com.github.dawid_stolarczyk.magazyn.Utils.CookiesUtils;
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
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static com.github.dawid_stolarczyk.magazyn.Utils.CookiesUtils.getCookie;
import static com.github.dawid_stolarczyk.magazyn.Utils.InternetUtils.getClientIp;

@Component
@RequiredArgsConstructor
@Slf4j
public class SessionAuthFilter extends OncePerRequestFilter {
    private final SessionService sessionService;
    private final UserRepository userRepository;
    private final SessionManager sessionManager;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String sessionId = getCookie(request, "SESSION");

        if (sessionId != null) {
            sessionService.getSession(sessionId).ifPresentOrElse(session -> {
                try {
                    User user = userRepository.findById(session.getUserId())
                            .orElseThrow(() -> new AuthenticationException(AuthError.NOT_AUTHENTICATED.name()));
                    if (user.getStatus().equals(AccountStatus.ACTIVE)
                            || user.getStatus().equals(AccountStatus.PENDING_VERIFICATION)
                            && user.getEmailStatus().equals(EmailStatus.VERIFIED)) {
                        sessionService.refreshSession(sessionId);
                        authenticateUser(user, session.getStatus2FA(), request);
                    } else {
                        SecurityContextHolder.clearContext();
                        sessionManager.logoutUser(response, request);
                        request.setAttribute("AUTH_LOGOUT", Boolean.TRUE);
                    }
                } catch (Exception e) {
                    log.warn("Session auth failed, logging out", e);
                    SecurityContextHolder.clearContext();
                    sessionManager.logoutUser(response, request);
                    request.setAttribute("AUTH_LOGOUT", Boolean.TRUE);
                }
            }, () -> {
                // Session cookie exists but session not found in Redis (expired or Redis restarted)
                log.warn("Session cookie exists but session not found in Redis, invalidating cookie");
                CookiesUtils.deleteCookie(response, "SESSION");
                authorizeViaRememberMe(request, response);
            });
        } else {
            authorizeViaRememberMe(request, response);
        }
        if (Boolean.TRUE.equals(request.getAttribute("AUTH_LOGOUT"))) {
            return;
        }
        filterChain.doFilter(request, response);
    }

    private void authenticateUser(User user, Status2FA status2FA, HttpServletRequest request) {
        boolean sudoMode = false;

        String twoFactorAuthId = CookiesUtils.getCookie(request, "2FA_AUTH");
        if (twoFactorAuthId != null) {
            TwoFactorAuth twoFactorAuth = sessionService.get2faAuth(twoFactorAuthId).orElseThrow(AuthenticationException::new);
            if (twoFactorAuth.getIpAddress().equals(getClientIp(request)) && twoFactorAuth.getUserAgent().equals(request.getHeader("User-Agent"))) {
                sudoMode = true;
            }
        }

        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));

        AuthPrincipal principal = new AuthPrincipal(user.getId(), status2FA, sudoMode);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(principal, null,
                authorities);
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    private void authorizeViaRememberMe(HttpServletRequest request, HttpServletResponse response) {
        String rememberMeToken = CookiesUtils.getCookie(request, "REMEMBER_ME");
        if (rememberMeToken != null) {
            sessionService.getRememberMeSession(rememberMeToken).ifPresentOrElse(rememberMeData -> {
                if (!rememberMeData.getIpAddress().equals(getClientIp(request)) ||
                        !rememberMeData.getUserAgent().equals(request.getHeader("User-Agent"))) {
                    log.warn("Remember-me token mismatch, logging out");
                    SecurityContextHolder.clearContext();
                    sessionManager.logoutUser(response, request);
                    request.setAttribute("AUTH_LOGOUT", Boolean.TRUE);
                    return;
                }
                User user;
                try {
                    user = userRepository.findById(rememberMeData.getUserId())
                            .orElseThrow(() -> new AuthenticationException(AuthError.NOT_AUTHENTICATED.name()));
                } catch (Exception e) {
                    log.warn("Remember-me user lookup failed, logging out", e);
                    SecurityContextHolder.clearContext();
                    sessionManager.logoutUser(response, request);
                    request.setAttribute("AUTH_LOGOUT", Boolean.TRUE);
                    return;
                }
                if (user.getStatus().equals(AccountStatus.ACTIVE)
                        || user.getStatus().equals(AccountStatus.PENDING_VERIFICATION)
                        && user.getEmailStatus().equals(EmailStatus.VERIFIED)) {
                    SessionData newSessionData = new SessionData(
                            UUID.randomUUID().toString(),
                            rememberMeData.getUserId(),
                            rememberMeData.getStatus2FA(),
                            getClientIp(request),
                            request.getHeader("User-Agent"));

                    sessionService.createSession(newSessionData);
                    authenticateUser(user, rememberMeData.getStatus2FA(), request);

                    CookiesUtils.setCookie(response, "SESSION", newSessionData.getSessionId(), null);
                } else {
                    log.info("Inactive user status, logging out");
                    SecurityContextHolder.clearContext();
                    sessionManager.logoutUser(response, request);
                    request.setAttribute("AUTH_LOGOUT", Boolean.TRUE);
                }
            }, () -> {
                sessionManager.logoutUser(response, request);
                request.setAttribute("AUTH_LOGOUT", Boolean.TRUE);
            });
        }
    }
}
