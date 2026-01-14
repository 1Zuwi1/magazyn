package com.github.dawid_stolarczyk.magazyn.Security.Filter;

import com.github.dawid_stolarczyk.magazyn.Common.Enums.AuthError;
import com.github.dawid_stolarczyk.magazyn.Exception.AuthenticationException;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AccountStatus;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.Status2FA;
import com.github.dawid_stolarczyk.magazyn.Repositories.UserRepository;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.AuthPrincipal;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.SessionData;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.TwoFactorAuth;
import com.github.dawid_stolarczyk.magazyn.Services.SessionService;
import com.github.dawid_stolarczyk.magazyn.Utils.CookiesUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
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
public class SessionAuthFilter extends OncePerRequestFilter {
    @Autowired
    private SessionService sessionService;
    @Autowired
    private UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String sessionId = getCookie(request, "SESSION");

        if (sessionId != null) {
            sessionService.getSession(sessionId).ifPresentOrElse(session -> {
                try {
                    User user = userRepository.findById(session.getUserId()).orElseThrow(RuntimeException::new);
                    if (user.getStatus().equals(AccountStatus.ACTIVE) || user.getStatus().equals(AccountStatus.PENDING_VERIFICATION)) {
                        sessionService.refreshSession(sessionId);
                        authenticateUser(user, session.getStatus2FA(), request);
                    }
                } catch (Exception ignore) {
                    sessionService.deleteSession(sessionId);
                    deleteAuthCookies(response);
                }
            }, () -> authorizeViaRememberMe(request, response));
        } else {
            authorizeViaRememberMe(request, response);
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
                    sessionService.deleteRemember(rememberMeToken);
                    sessionService.deleteSessionsCookies(response);
                    throw new AuthenticationException(AuthError.INVALID_REMEMBER_ME_TOKEN.name());
                }
                User user;
                try {
                    user = userRepository.findById(rememberMeData.getUserId()).orElseThrow(AuthenticationException::new);

                } catch (Exception e) {
                    sessionService.deleteRemember(rememberMeToken);
                    sessionService.deleteSessionsCookies(response);
                    return;
                }
                if (user.getStatus().equals(AccountStatus.ACTIVE) || user.getStatus().equals(AccountStatus.PENDING_VERIFICATION)) {
                    SessionData newSessionData = new SessionData(
                            UUID.randomUUID().toString(),
                            rememberMeData.getUserId(),
                            rememberMeData.getStatus2FA(),
                            getClientIp(request),
                            request.getHeader("User-Agent"));

                    sessionService.createSession(newSessionData);
                    authenticateUser(user, rememberMeData.getStatus2FA(), request);

                    CookiesUtils.setCookie(response, "SESSION", newSessionData.getSessionId(), null);
                }
            }, () -> sessionService.deleteSessionsCookies(response));
        }
    }

    private void deleteAuthCookies(HttpServletResponse response) {
        CookiesUtils.deleteCookie(response, "SESSION");
        CookiesUtils.deleteCookie(response, "REMEMBER_ME");
        CookiesUtils.deleteCookie(response, "2FA_AUTH");
    }
}
