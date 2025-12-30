package com.github.dawid_stolarczyk.magazyn.Model.Services;

import com.github.dawid_stolarczyk.magazyn.Controller.DTOs.TwoFactorAuthenticatorResponse;
import com.github.dawid_stolarczyk.magazyn.Model.Entities.BackupCode;
import com.github.dawid_stolarczyk.magazyn.Model.Entities.TwoFactor;
import com.github.dawid_stolarczyk.magazyn.Model.Entities.TwoFactorMethod;
import com.github.dawid_stolarczyk.magazyn.Model.Entities.User;
import com.github.dawid_stolarczyk.magazyn.Model.Repositories.UserRepository;
import com.github.dawid_stolarczyk.magazyn.Model.Security.JwtUtil;
import com.github.dawid_stolarczyk.magazyn.Model.Security.Status2FA;
import com.github.dawid_stolarczyk.magazyn.Model.Utils.CookiesUtils;
import com.github.dawid_stolarczyk.magazyn.Model.Utils.CodeGenerator;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

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
    private JwtUtil jwtUtil;

    @Value("${app.name}")
    private String appName;

    private final GoogleAuthenticator gAuth = new GoogleAuthenticator();

    public List<String> usersTwoFactorMethod() {
        User user = userRepository.findById(JwtUtil.getCurrentIdByAuthentication())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getTwoFactorMethods().stream().map(method -> method.getMethodName().name()).toList();
    }

    public void sendTwoFactorCodeViaEmail() {
        User user = userRepository.findById(JwtUtil.getCurrentIdByAuthentication())
                .orElseThrow(() -> new RuntimeException("User not found"));
        TwoFactorMethod method = user.getTwoFactorMethods().stream()
                .filter(m -> m.getMethodName() == TwoFactor.EMAIL)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Email 2FA method not enabled"));
        String code = CodeGenerator.generateWithNumbers(EMAIL_CODE_LENGTH);
        method.setEmailCode(code);
        method.setCodeGeneratedAt(Timestamp.from(Instant.now()));
        userRepository.save(user);

        emailService.sendTwoFactorCode(user.getEmail(), code);
    }

    public void checkTwoFactorEmailCode(String code, HttpServletResponse response) {
        User user = userRepository.findById(JwtUtil.getCurrentIdByAuthentication())
                .orElseThrow(() -> new RuntimeException("User not found"));
        TwoFactorMethod method = user.getTwoFactorMethods().stream()
                .filter(m -> m.getMethodName() == TwoFactor.EMAIL)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Email 2FA method not enabled"));
        if (method.getEmailCode() == null || !method.getEmailCode().equals(code)) {
            throw new RuntimeException("Invalid 2FA code");
        }
        if (method.getCodeGeneratedAt() == null
                || method.getCodeGeneratedAt().toInstant()
                        .plus(TWO_FACTOR_EMAIL_CODE_EXPIRATION_MINUTES, ChronoUnit.MINUTES).isBefore(Instant.now())) {
            throw new RuntimeException("2FA code expired");
        }

        method.setEmailCode(null);
        method.setCodeGeneratedAt(null);
        userRepository.save(user);

        successfulTwoFactorAuthentication(response, user);
    }

    public TwoFactorAuthenticatorResponse generateTwoFactorGoogleSecret() throws IOException {
        User user = userRepository.findById(JwtUtil.getCurrentIdByAuthentication())
                .orElseThrow(() -> new RuntimeException("User not found"));
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

    public void checkTwoFactorGoogleCode(int code, HttpServletResponse response) {
        User user = userRepository.findById(JwtUtil.getCurrentIdByAuthentication())
                .orElseThrow(() -> new RuntimeException("User not found"));
        TwoFactorMethod method = user.getTwoFactorMethods().stream()
                .filter(m -> m.getMethodName() == TwoFactor.AUTHENTICATOR)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Authenticator 2FA method not enabled"));

        if (method.getAuthenticatorSecret() == null) {
            throw new RuntimeException("Authenticator secret not set");
        }

        boolean isCodeValid = gAuth.authorize(method.getAuthenticatorSecret(), code);
        if (!isCodeValid) {
            throw new RuntimeException("Invalid 2FA code");
        }

        successfulTwoFactorAuthentication(response, user);
    }

    @Transactional
    public List<String> generateBackupCodes() {
        User user = userRepository.findById(JwtUtil.getCurrentIdByAuthentication())
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<BackupCode> backupCodes = new ArrayList<>();

        for (int i = 0; i < BACKUP_CODES_COUNT; i++) {
            BackupCode backupCode = new BackupCode();
            String code = CodeGenerator.generateWithBase62(BACKUP_CODE_LENGTH);
            backupCode.setCode(BCrypt.hashpw(code, BCrypt.gensalt()));
            backupCodes.add(backupCode);
            backupCode.setUser(user);
        }

        user.addTwoFactorMethod(new TwoFactorMethod(TwoFactor.BACKUP_CODES));
        user.setBackupCodes(backupCodes);
        userRepository.save(user);

        return new ArrayList<>(List.of("test"));
    }

    // TODO: 1. Email codes stored in plaintext (TwoFactorMethod.java:51)
    // Email 2FA codes should be hashed like backup codes, not stored plaintext.
    //
    // 2. Missing rate limiting
    // No rate limiting on 2FA code attempts or login attempts - vulnerable to brute
    // force.
    // 4. Missing input validation
    // LoginRegisterRequest.java lacks @Email, @NotBlank, @Pattern annotations.
    @PreAuthorize("hasAuthority('STATUS_2FA_PRE_2FA')")
    public void useBackupCode(String code, HttpServletResponse response) {
        User user = userRepository.findById(JwtUtil.getCurrentIdByAuthentication())
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.getTwoFactorMethods().stream()
                .filter(m -> TwoFactor.BACKUP_CODES.equals(m.getMethodName()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Backup codes 2FA method not enabled"));

        boolean correctCode = false;
        for (BackupCode backupCode : user.getBackupCodes()) {
            if (BCrypt.checkpw(code, backupCode.getCode()) && !backupCode.isUsed()) {
                correctCode = true;
                backupCode.setUsed(true);
                break;
            }
        }
        if (!correctCode) {
            throw new RuntimeException("Invalid backup code");
        }
        userRepository.save(user);
        successfulTwoFactorAuthentication(response, user);
    }

    private void successfulTwoFactorAuthentication(HttpServletResponse response, User user) {
        String jwt = jwtUtil.generateToken(user.getId(), Status2FA.VERIFIED);
        CookiesUtils.setCookie(response, "token", jwt, null);
    }
}
