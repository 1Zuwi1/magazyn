package com.github.dawid_stolarczyk.magazyn.Security;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.Status2FA;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.Entity.RememberMeData;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.Entity.SessionData;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.Entity.TwoFactorAuth;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.Redis.SessionService;
import com.github.dawid_stolarczyk.magazyn.Utils.CookiesUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static com.github.dawid_stolarczyk.magazyn.Utils.InternetUtils.getClientIp;

@Service
@AllArgsConstructor
public class SessionManager {
    private final SessionService sessionService;

    public void createSuccessLoginSession(User user, HttpServletRequest request, HttpServletResponse response, boolean rememberMe) {
        String sessionId = UUID.randomUUID().toString();
        SessionData sessionData = new SessionData(
                sessionId,
                user.getId(),
                Status2FA.PRE_2FA,
                getClientIp(request),
                request.getHeader("User-Agent"));

        CookiesUtils.setCookie(response, "SESSION", sessionService.createSession(sessionData), null);

        if (rememberMe) {
            RememberMeData rememberMeData = new RememberMeData(
                    UUID.randomUUID().toString(),
                    user.getId(),
                    Status2FA.PRE_2FA,
                    getClientIp(request),
                    request.getHeader("User-Agent"));

            CookiesUtils.setCookie(
                    response,
                    "REMEMBER_ME",
                    sessionService.createRememberToken(rememberMeData),
                    Duration.of(14, ChronoUnit.DAYS).getSeconds());
        }
    }

    public void create2FASuccessSession(User user, HttpServletRequest request, HttpServletResponse response) {
        TwoFactorAuth twoFactorAuth = new TwoFactorAuth(
                UUID.randomUUID().toString(),
                user.getId(),
                getClientIp(request),
                request.getHeader("User-Agent"));
        CookiesUtils.setCookie(response, "2FA_AUTH", sessionService.create2faAuth(twoFactorAuth), Duration.ofMinutes(5).toSeconds());
    }

    public void logoutUser(HttpServletResponse response, HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            new SecurityContextLogoutHandler().logout(request, response, auth);
        }

        String sessionId = CookiesUtils.getCookie(request, "SESSION");
        String rememberMeId = CookiesUtils.getCookie(request, "REMEMBER_ME");
        String twoFactorAuthId = CookiesUtils.getCookie(request, "2FA_AUTH");

        if (sessionId != null) {
            sessionService.deleteSession(sessionId);
        }
        if (rememberMeId != null) {
            sessionService.deleteRemember(rememberMeId);
        }
        if (twoFactorAuthId != null) {
            sessionService.delete2faAuth(twoFactorAuthId);
        }

        sessionService.deleteSessionsCookies(response);
    }
}
