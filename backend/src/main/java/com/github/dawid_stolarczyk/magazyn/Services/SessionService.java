package com.github.dawid_stolarczyk.magazyn.Services;

import com.github.dawid_stolarczyk.magazyn.Model.Enums.Status2FA;
import com.github.dawid_stolarczyk.magazyn.Repositories.RememberMeRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.SessionRepository;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.RememberMeData;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.SessionData;
import com.github.dawid_stolarczyk.magazyn.Utils.CookiesUtils;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SessionService {
    private static final Duration SESSION_TTL = Duration.ofMinutes(15);
    private static final Duration REMEMBER_TTL = Duration.ofDays(14);

    @Autowired
    private final SessionRepository sessionRepository;
    @Autowired
    private final RememberMeRepository rememberMeRepository;
    @Autowired
    private final RedisTemplate<String, Object> redis;

    public String createSession(SessionData data) {
        sessionRepository.save(data);
        redis.expire("session:" + data.getSessionId(), SESSION_TTL);
        return data.getSessionId();
    }

    public Optional<SessionData> getSession(String sessionId) {
        return sessionRepository.findById(sessionId);
    }

    public void refreshSession(String sessionId) {
        redis.expire("session:" + sessionId, SESSION_TTL);
    }

    public void deleteSession(String sessionId) {
        sessionRepository.deleteById(sessionId);
    }

    public void completeSessionTwoFactor(String sessionId, String rememberMeId) {
        if (sessionId != null) {
            sessionRepository.findById(sessionId).ifPresent(session -> {
                session.setStatus2FA(Status2FA.VERIFIED);
                sessionRepository.save(session);
                refreshSession(sessionId);
            });
        }
        if (rememberMeId != null) {
            rememberMeRepository.findById(rememberMeId).ifPresent(rememberMe -> {
                rememberMe.setStatus2FA(Status2FA.VERIFIED);
                rememberMeRepository.save(rememberMe);
            });
        }
    }

    // ---------- REMEMBER ME ----------

    public String createRememberToken(RememberMeData data) {
        rememberMeRepository.save(data);
        redis.expire("session:" + data.getId(), REMEMBER_TTL);
        return data.getId();
    }

    public Optional<RememberMeData> getRememberMeSession(String rememberMeId) {
        return rememberMeRepository.findById(rememberMeId);
    }

    public void deleteRemember(String token) {
        redis.delete("remember:" + token);
    }

    public void deleteSessionsCookies(HttpServletResponse response) {
        CookiesUtils.deleteCookie(response, "SESSION");
        CookiesUtils.deleteCookie(response, "REMEMBER_ME");
    }
}
