package com.github.dawid_stolarczyk.magazyn.Services.Auth;

import com.github.dawid_stolarczyk.magazyn.Common.Enums.AuthError;
import com.github.dawid_stolarczyk.magazyn.Exception.AuthenticationException;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.WebAuthnCredential;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AccountStatus;
import com.github.dawid_stolarczyk.magazyn.Repositories.UserRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.WebAuthRepository;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.AuthUtil;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.Entity.AuthPrincipal;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.Redis.RedisWebAuthSessionService;
import com.github.dawid_stolarczyk.magazyn.Security.SessionManager;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.RateLimitOperation;
import com.yubico.webauthn.*;
import com.yubico.webauthn.data.*;
import com.yubico.webauthn.data.exception.Base64UrlException;
import com.yubico.webauthn.exception.AssertionFailedException;
import com.yubico.webauthn.exception.RegistrationFailedException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.List;

import static com.github.dawid_stolarczyk.magazyn.Utils.InternetUtils.getClientIp;

@Service
public class WebAuthnService {

    private static final int MAX_PASSKEYS_PER_USER = 10;
    private final RelyingParty relyingParty;
    private final WebAuthRepository webAuthRepository;
    private final UserRepository userRepository;
    private final RedisWebAuthSessionService redisService;
    private final SessionManager sessionManager;
    private final Bucket4jRateLimiter rateLimiter;

    public WebAuthnService(RelyingParty relyingParty,
                           WebAuthRepository webAuthRepository, UserRepository userRepository,
                           RedisWebAuthSessionService redisService, SessionManager sessionManager, Bucket4jRateLimiter rateLimiter) {
        this.relyingParty = relyingParty;
        this.webAuthRepository = webAuthRepository;
        this.userRepository = userRepository;
        this.redisService = redisService;
        this.sessionManager = sessionManager;
        this.rateLimiter = rateLimiter;
    }

    /* ===================== REGISTRATION ===================== */

    public PublicKeyCredentialCreationOptions startRegistration(HttpServletRequest httpServletRequest) throws Base64UrlException {
        rateLimiter.consumeOrThrow(getClientIp(httpServletRequest), RateLimitOperation.WEBAUTH_REGISTRATION);

        AuthPrincipal authPrincipal = AuthUtil.getCurrentAuthPrincipal();
        if (!authPrincipal.isSudoMode()) {
            throw new AuthenticationException(AuthError.INSUFFICIENT_PERMISSIONS.name());
        }
        User userEntity = userRepository.findById(authPrincipal.getUserId()).orElseThrow();

        if (!userEntity.getStatus().equals(AccountStatus.ACTIVE))
            throw new AuthenticationException(AuthError.ACCOUNT_LOCKED.name());

        ByteArray userHandle = ByteArray.fromBase64Url(userEntity.getUserHandle());

        UserIdentity user = UserIdentity.builder()
                .name(userEntity.getEmail())
                .displayName(userEntity.getEmail())
                .id(userHandle)
                .build();

        StartRegistrationOptions options = StartRegistrationOptions.builder()
                .user(user)
                .authenticatorSelection(
                        AuthenticatorSelectionCriteria.builder()
                                .residentKey(ResidentKeyRequirement.REQUIRED)
                                .userVerification(UserVerificationRequirement.PREFERRED)
                                .build()
                )
                .build();

        PublicKeyCredentialCreationOptions request = relyingParty.startRegistration(options);

        // Zapis challenge + request w Redis pod userHandle
        redisService.saveRegistrationRequest(userHandle.getBase64Url(), request);

        return request;
    }

    @Transactional
    public void finishRegistration(String json, String keyName, HttpServletRequest httpServletRequest)
            throws IOException, RegistrationFailedException, Base64UrlException {
        rateLimiter.consumeOrThrow(getClientIp(httpServletRequest), RateLimitOperation.WEBAUTH_REGISTRATION);

        AuthPrincipal authPrincipal = AuthUtil.getCurrentAuthPrincipal();
        if (!authPrincipal.isSudoMode()) {
            throw new AuthenticationException(AuthError.INSUFFICIENT_PERMISSIONS.name());
        }
        User userEntity = userRepository.findById(authPrincipal.getUserId()).orElseThrow();

        if (!userEntity.getStatus().equals(AccountStatus.ACTIVE))
            throw new AuthenticationException(AuthError.ACCOUNT_LOCKED.name());

        ByteArray userHandle = ByteArray.fromBase64Url(userEntity.getUserHandle());

        // Limit check
        long currentKeys = webAuthRepository.countByUserHandle(userHandle.getBase64Url());
        if (currentKeys >= MAX_PASSKEYS_PER_USER) {
            throw new AuthenticationException(AuthError.TOO_MANY_PASSKEYS.name());
        }

        // Validate unique name for this user
        String finalKeyName = keyName != null && !keyName.isBlank() ? keyName : "Passkey " + (currentKeys + 1);
        if (webAuthRepository.existsByUserHandleAndName(userHandle.getBase64Url(), finalKeyName)) {
            throw new AuthenticationException(AuthError.PASSKEY_NAME_ALREADY_EXISTS.name());
        }

        // Pobieramy zapisany request z Redis
        PublicKeyCredentialCreationOptions request =
                redisService.getRegistrationRequest(userHandle.getBase64Url());

        // Parsujemy odpowiedź z frontendu
        PublicKeyCredential<AuthenticatorAttestationResponse, ClientRegistrationExtensionOutputs> response =
                PublicKeyCredential.parseRegistrationResponseJson(json);

        RegistrationResult result = relyingParty.finishRegistration(
                FinishRegistrationOptions.builder()
                        .request(request)
                        .response(response)
                        .build()
        );

        // Zapis credentiala w DB
        WebAuthnCredential entity = WebAuthnCredential.builder()
                .name(finalKeyName)
                .credentialId(result.getKeyId().getId().getBase64Url())
                .publicKeyCose(result.getPublicKeyCose().getBase64Url())
                .signatureCount(result.getSignatureCount())
                .userHandle(userHandle.getBase64Url())
                .email(userEntity.getEmail())
                .isDiscoverable(result.isDiscoverable().orElse(false))
                .build();


        webAuthRepository.save(entity);

        userEntity.addWebAuthnCredential(entity);
        userRepository.save(userEntity);

        // Usuwamy challenge z Redis
        redisService.delete(userHandle.getBase64Url());
    }

    public List<WebAuthnCredential> getMyPasskeys() {
        AuthPrincipal authPrincipal = AuthUtil.getCurrentAuthPrincipal();
        User userEntity = userRepository.findById(authPrincipal.getUserId()).orElseThrow();
        return webAuthRepository.findByUserHandle(userEntity.getUserHandle());
    }

    @Transactional
    public void deletePasskey(Long id) {
        AuthPrincipal authPrincipal = AuthUtil.getCurrentAuthPrincipal();
        if (!authPrincipal.isSudoMode()) {
            throw new AuthenticationException(AuthError.INSUFFICIENT_PERMISSIONS.name());
        }

        WebAuthnCredential credential = webAuthRepository.findById(id)
                .orElseThrow(() -> new AuthenticationException(AuthError.RESOURCE_NOT_FOUND.name()));

        User userEntity = userRepository.findById(authPrincipal.getUserId()).orElseThrow();

        if (!credential.getUserHandle().equals(userEntity.getUserHandle())) {
            throw new AuthenticationException(AuthError.INSUFFICIENT_PERMISSIONS.name());
        }

        webAuthRepository.delete(credential);
    }

    @Transactional
    public void renamePasskey(Long id, String newName) {
        AuthPrincipal authPrincipal = AuthUtil.getCurrentAuthPrincipal();
        if (!authPrincipal.isSudoMode()) {
            throw new AuthenticationException(AuthError.INSUFFICIENT_PERMISSIONS.name());
        }

        User userEntity = userRepository.findById(authPrincipal.getUserId()).orElseThrow();

        WebAuthnCredential credential = webAuthRepository.findById(id)
                .orElseThrow(() -> new AuthenticationException(AuthError.RESOURCE_NOT_FOUND.name()));

        // Verify ownership
        if (!credential.getUserHandle().equals(userEntity.getUserHandle())) {
            throw new AuthenticationException(AuthError.INSUFFICIENT_PERMISSIONS.name());
        }

        // Validate new name is not empty
        if (newName == null || newName.isBlank()) {
            throw new AuthenticationException(AuthError.INVALID_INPUT.name());
        }

        // Validate unique name for this user (excluding current credential)
        if (webAuthRepository.existsByUserHandleAndNameAndIdNot(
                userEntity.getUserHandle(), newName, id)) {
            throw new AuthenticationException(AuthError.PASSKEY_NAME_ALREADY_EXISTS.name());
        }

        credential.setName(newName);
        webAuthRepository.save(credential);
    }

    /* ===================== ASSERTION ===================== */

    public PublicKeyCredentialRequestOptions startAssertion(HttpServletRequest httpServletRequest)
            throws Base64UrlException {
        rateLimiter.consumeOrThrow(getClientIp(httpServletRequest), RateLimitOperation.WEBAUTH_ASSERTION);

        AssertionRequest assertionRequest = relyingParty.startAssertion(
                StartAssertionOptions.builder()
                        .userVerification(UserVerificationRequirement.PREFERRED)
                        .build()
        );

        String challengeBase64Url =
                assertionRequest.getPublicKeyCredentialRequestOptions()
                        .getChallenge()
                        .getBase64Url();

        redisService.saveAssertionRequest(challengeBase64Url, assertionRequest);

        return assertionRequest.getPublicKeyCredentialRequestOptions();
    }

    @Transactional
    public boolean finishAssertion(String json, HttpServletResponse httpServletResponse, HttpServletRequest httpServletRequest)
            throws IOException, AssertionFailedException {
        rateLimiter.consumeOrThrow(getClientIp(httpServletRequest), RateLimitOperation.WEBAUTH_ASSERTION);

        PublicKeyCredential<AuthenticatorAssertionResponse, ClientAssertionExtensionOutputs> credential =
                PublicKeyCredential.parseAssertionResponseJson(json);

        // userHandle zawsze zwracany przez authenticator
        ByteArray userHandle = credential.getResponse()
                .getUserHandle()
                .orElseThrow(() -> new IllegalStateException("Missing userHandle"));

        String challengeFromClient =
                credential.getResponse()
                        .getClientData()
                        .getChallenge()
                        .getBase64Url();
        try {
            // Pobranie requestu z Redis
            AssertionRequest assertionRequest =
                    redisService.getAssertionRequest(challengeFromClient);
            // Weryfikacja
            AssertionResult result = relyingParty.finishAssertion(
                    FinishAssertionOptions.builder()
                            .request(assertionRequest)
                            .response(credential)
                            .build()
            );
            if (!result.isSuccess()) return false;

            // Aktualizacja countera w DB
            webAuthRepository.updateSignatureCount(
                    credential.getId().getBase64Url(),
                    result.getSignatureCount()
            );

            String email = webAuthRepository.findFirstByUserHandle(userHandle.getBase64Url())
                    .orElseThrow(() -> new IllegalStateException("User not found"))
                    .getEmail();

            successLogin(
                    email,
                    httpServletResponse,
                    httpServletRequest
            );
        } finally {
            redisService.delete(challengeFromClient);
        }

        return true;
    }

    private void successLogin(String email, HttpServletResponse httpServletResponse, HttpServletRequest httpServletRequest) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AuthenticationException(AuthError.INVALID_CREDENTIALS.name()));

        if (!user.getStatus().equals(AccountStatus.ACTIVE) && !user.getStatus().equals(AccountStatus.PENDING_VERIFICATION)) {
            throw new AuthenticationException(AuthError.ACCOUNT_LOCKED.name());
        }
        sessionManager.createSuccessLoginSession(user, httpServletRequest, httpServletResponse, true, true);
    }

}
