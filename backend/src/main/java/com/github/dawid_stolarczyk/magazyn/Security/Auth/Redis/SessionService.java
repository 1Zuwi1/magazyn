package com.github.dawid_stolarczyk.magazyn.Security.Auth.Redis;

import com.github.dawid_stolarczyk.magazyn.Model.Enums.Status2FA;
import com.github.dawid_stolarczyk.magazyn.Repositories.Redis.RememberMeRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.Redis.SessionRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.Redis.TwoFactorAuthRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.Redis.WebAuthnChallengeRepository;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.Entity.RememberMeData;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.Entity.SessionData;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.Entity.TwoFactorAuth;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.Entity.WebAuthnChallenge;
import com.github.dawid_stolarczyk.magazyn.Utils.CookiesUtils;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;

@Service
public class SessionService {
    private static final Duration SESSION_TTL = Duration.ofMinutes(15);
    private static final Duration REMEMBER_TTL = Duration.ofDays(14);
    private static final Duration TWO_FACTOR_AUTH_TTL = Duration.ofMinutes(5);

    @Autowired
    private SessionRepository sessionRepository;
    @Autowired
    private RememberMeRepository rememberMeRepository;
    @Autowired
    private TwoFactorAuthRepository twoFactorAuthRepository;
    @Autowired
    private WebAuthnChallengeRepository webAuthnChallengeRepository;
    @Autowired
    private RedisTemplate<String, Object> redis;

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
        redis.expire("remember:" + data.getId(), REMEMBER_TTL);
        return data.getId();
    }

    public Optional<RememberMeData> getRememberMeSession(String rememberMeId) {
        return rememberMeRepository.findById(rememberMeId);
    }

    public void deleteRemember(String token) {
        redis.delete("remember:" + token);
    }

    // ---------- 2FA AUTH ----------

    public String create2faAuth(TwoFactorAuth data) {
        twoFactorAuthRepository.save(data);
        redis.expire("2fa_auth:" + data.getId(), TWO_FACTOR_AUTH_TTL);
        return data.getId();
    }

    public Optional<TwoFactorAuth> get2faAuth(String twoFactorAuthId) {
        return twoFactorAuthRepository.findById(twoFactorAuthId);
    }

    public void delete2faAuth(String token) {
        redis.delete("2fa_auth:" + token);
    }



    // ---------- PASSKEY CHALLENGE ----------

    public String createWebauthnChallenge(WebAuthnChallenge data) {
        getWebauthnChallenge(data.getUserIdKey()).ifPresent(existing -> webAuthnChallengeRepository.deleteById(existing.getUserIdKey()));
        webAuthnChallengeRepository.save(data);
        redis.expire("webauthnChallenge:" + data.getUserId(), TWO_FACTOR_AUTH_TTL);
        return data.getUserIdKey();
    }

    public Optional<WebAuthnChallenge> getWebauthnChallenge(String webAuthnChallengeId) {
        return webAuthnChallengeRepository.findById(webAuthnChallengeId);
    }

    public void deleteWebauthnChallenge(String token) {
        redis.delete("webauthnChallenge:" + token);
    }


    public void deleteSessionsCookies(HttpServletResponse response) {
        CookiesUtils.deleteCookie(response, "SESSION");
        CookiesUtils.deleteCookie(response, "REMEMBER_ME");
        CookiesUtils.deleteCookie(response, "2FA_AUTH");
    }

}
