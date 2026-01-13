package com.github.dawid_stolarczyk.magazyn.Services;

import com.github.dawid_stolarczyk.magazyn.Common.Enums.AuthError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.CodeRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.TwoFactorAuthenticatorResponse;
import com.github.dawid_stolarczyk.magazyn.Exception.AuthenticationException;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.BackupCode;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.TwoFactorMethod;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.TwoFactor;
import com.github.dawid_stolarczyk.magazyn.Repositories.UserRepository;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.AuthPrincipal;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.AuthUtil;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.TwoFactorAuth;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.RateLimitOperation;
import com.github.dawid_stolarczyk.magazyn.Utils.CodeGenerator;
import com.github.dawid_stolarczyk.magazyn.Utils.CookiesUtils;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static com.github.dawid_stolarczyk.magazyn.Utils.InternetUtils.getClientIp;

@Service
public class TwoFactorService {
    private static final int BACKUP_CODES_COUNT = 8;
    private static final int BACKUP_CODE_LENGTH = 12;
    private static final int EMAIL_CODE_LENGTH = 6;
    private static final int TWO_FACTOR_EMAIL_CODE_EXPIRATION_MINUTES = 15;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private EmailService emailService;
    @Autowired
    private SessionService sessionService;

    @Value("${app.name}")
    private String appName;

    private final GoogleAuthenticator gAuth = new GoogleAuthenticator();

    @Autowired
    private Bucket4jRateLimiter rateLimiter;


    public List<String> getUsersTwoFactorMethods(HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.TWO_FACTOR_FREE);
        User user = userRepository.findById(AuthUtil.getCurrentAuthPrincipal().getUserId())
                .orElseThrow(() -> new AuthenticationException("", "User not found"));
        return user.getTwoFactorMethods().stream().map(method -> method.getMethodName().name()).toList();
    }

    public void sendTwoFactorCodeViaEmail(HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.TWO_FACTOR_STRICT);
        User user = userRepository.findById(AuthUtil.getCurrentAuthPrincipal().getUserId())
                .orElseThrow(() -> new AuthenticationException("", "User not found"));
        TwoFactorMethod method = user.getTwoFactorMethods().stream()
                .filter(m -> m.getMethodName() == TwoFactor.EMAIL)
                .findFirst()
                .orElseThrow(() -> new AuthenticationException(AuthError.TWO_FA_NOT_ENABLED.name(), "Email 2FA method not enabled"));
        String code = CodeGenerator.generateWithNumbers(EMAIL_CODE_LENGTH);
        method.setEmailCode(BCrypt.hashpw(code, BCrypt.gensalt()));
        method.setCodeGeneratedAt(Timestamp.from(Instant.now()));
        userRepository.save(user);

        emailService.sendTwoFactorCode(user.getEmail(), code);
    }

    public void checkTwoFactorEmailCode(String code, User user) {
        TwoFactorMethod method = user.getTwoFactorMethods().stream()
                .filter(m -> m.getMethodName() == TwoFactor.EMAIL)
                .findFirst()
                .orElseThrow(() -> new AuthenticationException(AuthError.TWO_FA_NOT_ENABLED.name()));

        if (method.getEmailCode() == null || !BCrypt.checkpw(code, method.getEmailCode())) {
            throw new AuthenticationException(AuthError.INVALID_OR_EXPIRED_CODE.name());
        }

        if (method.getCodeGeneratedAt() == null
                || method.getCodeGeneratedAt().toInstant()
                .plus(TWO_FACTOR_EMAIL_CODE_EXPIRATION_MINUTES, ChronoUnit.MINUTES).isBefore(Instant.now())) {
            throw new AuthenticationException(AuthError.INVALID_OR_EXPIRED_CODE.name());
        }

        method.setEmailCode(null);
        method.setCodeGeneratedAt(null);
        userRepository.save(user);
    }

    public TwoFactorAuthenticatorResponse generateTwoFactorGoogleSecret(HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.TWO_FACTOR_STRICT);
        User user = userRepository.findById(AuthUtil.getCurrentAuthPrincipal().getUserId())
                .orElseThrow(() -> new AuthenticationException("", "User not found"));
        TwoFactorMethod method = user.getTwoFactorMethods().stream()
                .filter(m -> m.getMethodName() == TwoFactor.AUTHENTICATOR)
                .findFirst()
                .orElseGet(() -> {
                    TwoFactorMethod newMethod = new TwoFactorMethod();
                    newMethod.setMethodName(TwoFactor.AUTHENTICATOR);
                    user.addTwoFactorMethod(newMethod);
                    return newMethod;
                });

        String secret = gAuth.createCredentials().getKey();
        method.setAuthenticatorSecret(secret);
        userRepository.save(user);

        return new TwoFactorAuthenticatorResponse(secret, user.getEmail(), appName);
    }

    public void checkTwoFactorGoogleCode(int code, User user) {
        TwoFactorMethod method = user.getTwoFactorMethods().stream()
                .filter(m -> m.getMethodName() == TwoFactor.AUTHENTICATOR)
                .findFirst()
                .orElseThrow(() -> new AuthenticationException(AuthError.TWO_FA_NOT_ENABLED.name()));

        if (method.getAuthenticatorSecret() == null) {
            throw new AuthenticationException(AuthError.INVALID_OR_EXPIRED_CODE.name());
        }

        boolean isCodeValid = gAuth.authorize(method.getAuthenticatorSecret(), code);
        if (!isCodeValid) {
            throw new AuthenticationException(AuthError.INVALID_OR_EXPIRED_CODE.name());
        }

    }

    public void checkCode(CodeRequest codeRequest, HttpServletRequest request, HttpServletResponse response) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.TWO_FACTOR_VERIFY);
        User user = userRepository.findById(AuthUtil.getCurrentAuthPrincipal().getUserId())
                .orElseThrow(() -> new AuthenticationException("", "User not found"));

        if (TwoFactor.valueOf(codeRequest.getMethod()).equals(TwoFactor.EMAIL)) {
            checkTwoFactorEmailCode(codeRequest.getCode(), user);
        } else if (codeRequest.getMethod().equals(TwoFactor.AUTHENTICATOR.name())) {
            try {
                checkTwoFactorGoogleCode(Integer.parseInt(codeRequest.getCode()), user);
            } catch (NumberFormatException e) {
                throw new AuthenticationException(AuthError.CODE_FORMAT_INVALID.name());
            }
        } else if (TwoFactor.valueOf(codeRequest.getMethod()).equals(TwoFactor.BACKUP_CODES)) {
            useBackupCode(codeRequest.getCode(), request);
        } else {
            throw new AuthenticationException(AuthError.TWO_FA_NOT_ENABLED.name());
        }
        successfulTwoFactorAuthentication(request);
        TwoFactorAuth twoFactorAuth = new TwoFactorAuth(
                UUID.randomUUID().toString(),
                user.getId(),
                getClientIp(request),
                request.getHeader("User-Agent"));
        CookiesUtils.setCookie(response, "2FA_AUTH", sessionService.create2faAuth(twoFactorAuth), Duration.ofMinutes(5).toSeconds());
    }

    @Transactional
    public List<String> generateBackupCodes(HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.TWO_FACTOR_VERIFY);

        AuthPrincipal authPrincipal = AuthUtil.getCurrentAuthPrincipal();
        if (!authPrincipal.isSudoMode()) {
            throw new AuthenticationException(AuthError.INSUFFICIENT_PERMISSIONS.name());
        }

        User user = userRepository.findById(AuthUtil.getCurrentAuthPrincipal().getUserId())
                .orElseThrow(() -> new AuthenticationException("", "User not found"));
        List<BackupCode> backupCodes = new ArrayList<>();

        List<String> codes = new ArrayList<>();
        user.getBackupCodes().clear();
        for (int i = 0; i < BACKUP_CODES_COUNT; i++) {
            BackupCode backupCode = new BackupCode();
            String code = CodeGenerator.generateBackupCodeWithBase62(BACKUP_CODE_LENGTH);
            backupCode.setCode(BCrypt.hashpw(code, BCrypt.gensalt()));
            backupCodes.add(backupCode);
            backupCode.setUser(user);

            codes.add(code);
        }

        user.addTwoFactorMethod(new TwoFactorMethod(TwoFactor.BACKUP_CODES));
        user.getBackupCodes().addAll(backupCodes);
        userRepository.save(user);

        return codes;
    }


    public void useBackupCode(String code, HttpServletRequest request) {
        User user = userRepository.findById(AuthUtil.getCurrentAuthPrincipal().getUserId())
                .orElseThrow(() -> new AuthenticationException("", "User not found"));

        user.getTwoFactorMethods().stream()
                .filter(m -> TwoFactor.BACKUP_CODES.equals(m.getMethodName()))
                .findFirst()
                .orElseThrow(() -> new AuthenticationException(AuthError.TWO_FA_NOT_ENABLED.name()));

        boolean correctCode = false;
        for (BackupCode backupCode : user.getBackupCodes()) {
            if (BCrypt.checkpw(code, backupCode.getCode()) && !backupCode.isUsed()) {
                correctCode = true;
                backupCode.setUsed(true);
                break;
            }
        }
        if (!correctCode) {
            throw new AuthenticationException(AuthError.INVALID_OR_EXPIRED_CODE.name());
        }
        userRepository.save(user);

        successfulTwoFactorAuthentication(request);
    }

    private void successfulTwoFactorAuthentication(HttpServletRequest request) {
        String sessionId = CookiesUtils.getCookie(request, "SESSION");
        String rememberMeId = CookiesUtils.getCookie(request, "REMEMBER_ME");
        sessionService.completeSessionTwoFactor(sessionId, rememberMeId);
    }
}
