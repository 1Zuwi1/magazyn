package com.github.dawid_stolarczyk.magazyn.Services.Auth;

import com.github.dawid_stolarczyk.magazyn.Common.Enums.AuthError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.CodeRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.FinishTwoFactorAuthenticatorRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.TwoFactorAuthenticatorResponse;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.TwoFactorMethodsResponse;
import com.github.dawid_stolarczyk.magazyn.Exception.AuthenticationException;
import com.github.dawid_stolarczyk.magazyn.Exception.TwoFactorNotVerifiedException;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.BackupCode;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.TwoFactorMethod;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.Default2faMethod;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.Status2FA;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.TwoFactor;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.UserRepository;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.AuthUtil;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.Entity.AuthPrincipal;
import com.github.dawid_stolarczyk.magazyn.Security.SessionManager;
import com.github.dawid_stolarczyk.magazyn.Services.EmailService;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.RateLimitOperation;
import com.github.dawid_stolarczyk.magazyn.Utils.CodeGenerator;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import static com.github.dawid_stolarczyk.magazyn.Utils.InternetUtils.getClientIp;

@Service
@RequiredArgsConstructor
public class TwoFactorService {
    private static final int BACKUP_CODES_COUNT = 8;
    private static final int BACKUP_CODE_LENGTH = 12;
    private static final int EMAIL_CODE_LENGTH = 6;
    private static final int TWO_FACTOR_EMAIL_CODE_EXPIRATION_MINUTES = 15;
    private static final String DUMMY_BCRYPT_HASH = BCrypt.hashpw("dummy", BCrypt.gensalt());

    private final UserRepository userRepository;
    private final EmailService emailService;
    private final SessionManager sessionManager;
    private final Bucket4jRateLimiter rateLimiter;

    @Value("${app.name}")
    private String appName;

    private final GoogleAuthenticator gAuth = new GoogleAuthenticator();


    public TwoFactorMethodsResponse getUsersTwoFactorMethods(HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.TWO_FACTOR_FREE);
        User user = userRepository.findById(AuthUtil.getCurrentAuthPrincipal().getUserId())
                .orElseThrow(AuthenticationException::new);
        List<String> methods = new ArrayList<>(user.getTwoFactorMethods().stream()
                .filter(TwoFactorMethod::isFinished)
                .map(method -> method.getMethodName().name()).toList());
        methods.add(Default2faMethod.EMAIL.name());

        if (!user.getWebAuthnCredentials().isEmpty()) {
            methods.add(Default2faMethod.PASSKEYS.name());
        }

        return TwoFactorMethodsResponse.builder()
                .methods(methods)
                .defaultMethod(user.getDefault2faMethod())
                .build();
    }

    @Transactional
    public void sendTwoFactorCodeViaEmail(HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.TWO_FACTOR_STRICT);
        User user = userRepository.findById(AuthUtil.getCurrentAuthPrincipal().getUserId())
                .orElseThrow(() -> new AuthenticationException(AuthError.NOT_AUTHENTICATED.name()));

        String code = CodeGenerator.generateWithNumbers(EMAIL_CODE_LENGTH);
        user.setVerifyCode(BCrypt.hashpw(code, BCrypt.gensalt()));
        user.setVerifyCodeGeneratedAt(Timestamp.from(Instant.now()));
        userRepository.save(user);

        emailService.sendTwoFactorCode(user.getEmail(), code);
    }

    public void checkTwoFactorEmailCode(String code, User user) {
        if (user.getVerifyCodeGeneratedAt() == null
                || user.getVerifyCodeGeneratedAt().toInstant()
                .plus(TWO_FACTOR_EMAIL_CODE_EXPIRATION_MINUTES, ChronoUnit.MINUTES).isBefore(Instant.now())) {
            throw new AuthenticationException(AuthError.INVALID_OR_EXPIRED_CODE.name());
        }

        String storedHash = user.getVerifyCode();
        if (storedHash == null) {
            BCrypt.checkpw(code, DUMMY_BCRYPT_HASH);
            throw new AuthenticationException(AuthError.INVALID_OR_EXPIRED_CODE.name());
        }

        if (!BCrypt.checkpw(code, storedHash)) {
            throw new AuthenticationException(AuthError.INVALID_OR_EXPIRED_CODE.name());
        }

        user.setVerifyCode(null);
        user.setVerifyCodeGeneratedAt(null);
        userRepository.save(user);
    }

    public TwoFactorAuthenticatorResponse generateTwoFactorGoogleSecret(HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.TWO_FACTOR_STRICT);
        User user = userRepository.findById(AuthUtil.getCurrentAuthPrincipal().getUserId())
                .orElseThrow(() -> new AuthenticationException(AuthError.NOT_AUTHENTICATED.name()));

        TwoFactorMethod method = user.getTwoFactorMethods().stream()
                .filter(m -> m.getMethodName() == TwoFactor.AUTHENTICATOR)
                .findFirst()
                .orElseGet(() -> {
                    TwoFactorMethod newMethod = new TwoFactorMethod();
                    newMethod.setMethodName(TwoFactor.AUTHENTICATOR);
                    user.addTwoFactorMethod(newMethod);
                    return newMethod;
                });

        method.setFinished(false);
        String secret = gAuth.createCredentials().getKey();
        method.setAuthenticatorSecret(secret);
        userRepository.save(user);

        return new TwoFactorAuthenticatorResponse(secret, user.getEmail(), appName);
    }

    public void finishTwoFactorGoogleSecret(FinishTwoFactorAuthenticatorRequest finishTwoFactorAuthenticatorRequest, HttpServletRequest request) throws AuthenticationException {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.TWO_FACTOR_VERIFY);
        int code;
        try {
            code = Integer.parseInt(finishTwoFactorAuthenticatorRequest.getCode());
        } catch (NumberFormatException e) {
            throw new AuthenticationException(AuthError.CODE_FORMAT_INVALID.name());
        }

        User user = userRepository.findById(AuthUtil.getCurrentAuthPrincipal().getUserId())
                .orElseThrow(() -> new AuthenticationException(AuthError.NOT_AUTHENTICATED.name()));

        TwoFactorMethod method = user.getTwoFactorMethods().stream()
                .filter(m -> m.getMethodName() == TwoFactor.AUTHENTICATOR)
                .findFirst().orElseThrow(() -> new AuthenticationException(AuthError.TWO_FA_NOT_ENABLED.name()));

        if (checkTwoFactorGoogleCode(code, user, true)) {
            method.setFinished(true);
            userRepository.save(user);
        }
    }


    public boolean checkTwoFactorGoogleCode(int code, User user, boolean finishSetup) {
        TwoFactorMethod method = user.getTwoFactorMethods().stream()
                .filter(m -> m.getMethodName() == TwoFactor.AUTHENTICATOR && (m.isFinished() || finishSetup))
                .findFirst()
                .orElseThrow(() -> new AuthenticationException(AuthError.TWO_FA_NOT_ENABLED.name()));

        if (method.getAuthenticatorSecret() == null) {
            throw new AuthenticationException(AuthError.INVALID_OR_EXPIRED_CODE.name());
        }

        boolean isCodeValid = gAuth.authorize(method.getAuthenticatorSecret(), code);
        if (!isCodeValid) {
            throw new AuthenticationException(AuthError.INVALID_OR_EXPIRED_CODE.name());
        }

        return true;
    }

    public void checkCode(CodeRequest codeRequest, HttpServletRequest request, HttpServletResponse response) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.TWO_FACTOR_VERIFY);
        User user = userRepository.findById(AuthUtil.getCurrentAuthPrincipal().getUserId())
                .orElseThrow(() -> new AuthenticationException(AuthError.NOT_AUTHENTICATED.name()));

        String method = codeRequest.getMethod();

        if (method.equals("EMAIL")) {
            checkTwoFactorEmailCode(codeRequest.getCode(), user);
        } else if (method.equals(TwoFactor.AUTHENTICATOR.name())) {
            try {
                checkTwoFactorGoogleCode(Integer.parseInt(codeRequest.getCode()), user, false);
            } catch (NumberFormatException e) {
                throw new AuthenticationException(AuthError.CODE_FORMAT_INVALID.name());
            }
        } else if (method.equals(TwoFactor.BACKUP_CODES.name())) {
            useBackupCode(codeRequest.getCode(), request, response);
        } else {
            throw new AuthenticationException(AuthError.TWO_FA_NOT_ENABLED.name());
        }
        sessionManager.create2FASuccessSession(user, request, response);
    }

    @Transactional
    public List<String> generateBackupCodes(HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.TWO_FACTOR_VERIFY);

        AuthPrincipal authPrincipal = AuthUtil.getCurrentAuthPrincipal();
        if (!authPrincipal.isSudoMode()) {
            throw new AuthenticationException(AuthError.INSUFFICIENT_PERMISSIONS.name());
        }

        User user = userRepository.findById(AuthUtil.getCurrentAuthPrincipal().getUserId())
                .orElseThrow(() -> new AuthenticationException(AuthError.NOT_AUTHENTICATED.name()));
        List<BackupCode> backupCodes = new ArrayList<>();

        List<String> codes = new ArrayList<>();
        user.getBackupCodes().clear();
        userRepository.saveAndFlush(user);
        for (int i = 0; i < BACKUP_CODES_COUNT; i++) {
            BackupCode backupCode = new BackupCode();
            String code = CodeGenerator.generateBackupCodeWithBase62(BACKUP_CODE_LENGTH);
            backupCode.setCode(BCrypt.hashpw(code, BCrypt.gensalt()));
            backupCodes.add(backupCode);
            backupCode.setUser(user);

            codes.add(code);
        }

        if (user.getTwoFactorMethods().stream().noneMatch(m -> TwoFactor.BACKUP_CODES.equals(m.getMethodName()))) {
            user.addTwoFactorMethod(new TwoFactorMethod(TwoFactor.BACKUP_CODES));
        }
        user.getBackupCodes().addAll(backupCodes);
        userRepository.save(user);

        return codes;
    }


    public void useBackupCode(String code, HttpServletRequest request, HttpServletResponse response) {
        User user = userRepository.findById(AuthUtil.getCurrentAuthPrincipal().getUserId())
                .orElseThrow(() -> new AuthenticationException(AuthError.NOT_AUTHENTICATED.name()));

        user.getTwoFactorMethods().stream()
                .filter(m -> TwoFactor.BACKUP_CODES.equals(m.getMethodName()) && m.isFinished())
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

        sessionManager.create2FASuccessSession(user, request, response);
    }

    public void removeTwoFactorMethod(String stringMethod, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.TWO_FACTOR_FREE);

        AuthPrincipal authPrincipal = AuthUtil.getCurrentAuthPrincipal();
        if (!authPrincipal.getStatus2FA().equals(Status2FA.VERIFIED)) {
            throw new TwoFactorNotVerifiedException();
        }
        if (!authPrincipal.isSudoMode()) {
            throw new AuthenticationException(AuthError.INSUFFICIENT_PERMISSIONS.name());
        }

        TwoFactor method;
        try {
            method = TwoFactor.valueOf(stringMethod);
        } catch (IllegalArgumentException e) {
            if (stringMethod.equals("EMAIL")) {
                throw new AuthenticationException(AuthError.EMAIL_2FA_REQUIRED.name());
            }
            throw new AuthenticationException(AuthError.TWO_FA_NOT_ENABLED.name());
        }

        User user = userRepository.findById(authPrincipal.getUserId())
                .orElseThrow(() -> new AuthenticationException(AuthError.NOT_AUTHENTICATED.name()));

        List<TwoFactorMethod> methods = user.getTwoFactorMethods().stream()
                .filter(m -> m.getMethodName() == method).toList();

        if (methods.isEmpty()) {
            throw new AuthenticationException(AuthError.TWO_FA_NOT_ENABLED.name());
        }

        if (method == TwoFactor.BACKUP_CODES) {
            user.getBackupCodes().clear();
        }

        methods.forEach(user::removeTwoFactorMethod);
        userRepository.save(user);
    }

    @Transactional
    public void setDefaultTwoFactorMethod(Default2faMethod method, HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.TWO_FACTOR_FREE);

        AuthPrincipal authPrincipal = AuthUtil.getCurrentAuthPrincipal();
        if (!authPrincipal.isSudoMode()) {
            throw new AuthenticationException(AuthError.INSUFFICIENT_PERMISSIONS.name());
        }

        User user = userRepository.findById(authPrincipal.getUserId())
                .orElseThrow(() -> new AuthenticationException(AuthError.NOT_AUTHENTICATED.name()));

        if (method == Default2faMethod.EMAIL) {
            user.setDefault2faMethod(Default2faMethod.EMAIL);
        } else if (method == Default2faMethod.PASSKEYS) {
            if (user.getWebAuthnCredentials().isEmpty()) {
                throw new AuthenticationException(AuthError.TWO_FA_NOT_ENABLED.name());
            }
            user.setDefault2faMethod(Default2faMethod.PASSKEYS);
        } else {
            TwoFactor expected = method == Default2faMethod.AUTHENTICATOR
                    ? TwoFactor.AUTHENTICATOR
                    : TwoFactor.BACKUP_CODES;

            boolean hasMethod = user.getTwoFactorMethods().stream()
                    .anyMatch(m -> m.getMethodName() == expected);

            if (!hasMethod) {
                throw new AuthenticationException(AuthError.TWO_FA_NOT_ENABLED.name());
            }
            user.setDefault2faMethod(method);
        }

        userRepository.save(user);
    }
}
