package com.github.dawid_stolarczyk.magazyn.Services;

import com.github.dawid_stolarczyk.magazyn.Common.Enums.AuthError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.UserIdDto;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.UsernameDto;
import com.github.dawid_stolarczyk.magazyn.Exception.AuthenticationException;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.WebAuthnCredential;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AccountStatus;
import com.github.dawid_stolarczyk.magazyn.Repositories.UserRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.WebAuthRepository;
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

    public PublicKeyCredentialCreationOptions startRegistration(UserIdDto dto, HttpServletRequest httpServletRequest) throws Base64UrlException {
        rateLimiter.consumeOrThrow(getClientIp(httpServletRequest), RateLimitOperation.WEBAUTH_REGISTRATION);
        // Używamy userHandle jako stabilnego identyfikatora
        User userEntity = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new IllegalStateException("User not found"));

        ByteArray userHandle = ByteArray.fromBase64Url(userEntity.getUserHandle());

        UserIdentity user = UserIdentity.builder()
                .name(dto.getEmail())
                .displayName(dto.getEmail())
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
    public void finishRegistration(String json, String email, HttpServletRequest httpServletRequest)
            throws IOException, RegistrationFailedException, Base64UrlException {
        rateLimiter.consumeOrThrow(getClientIp(httpServletRequest), RateLimitOperation.WEBAUTH_REGISTRATION);

        if (email == null || email.isEmpty()) {
            throw new IllegalStateException("Email is required");
        }

        User userEntity = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found"));
        ;
        ByteArray userHandle = ByteArray.fromBase64Url(userEntity.getUserHandle());

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
                .credentialId(result.getKeyId().getId().getBase64Url())
                .publicKeyCose(result.getPublicKeyCose().getBase64Url())
                .signatureCount(result.getSignatureCount())
                .userHandle(userHandle.getBase64Url())
                .email(email)
                .isDiscoverable(result.isDiscoverable().orElse(false))
                .build();


        webAuthRepository.save(entity);

        // Usuwamy challenge z Redis
        redisService.delete(userHandle.getBase64Url());
    }

    /* ===================== ASSERTION ===================== */

    public PublicKeyCredentialRequestOptions startAssertion(UsernameDto dto, HttpServletRequest httpServletRequest)
            throws Base64UrlException {
        rateLimiter.consumeOrThrow(getClientIp(httpServletRequest), RateLimitOperation.WEBAUTH_ASSERTION);

        User userEntity = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new IllegalStateException("User not found"));

        ByteArray userHandle = ByteArray.fromBase64Url(userEntity.getUserHandle());

        // Lista credentiali dozwolonych dla użytkownika
        List<PublicKeyCredentialDescriptor> allowCredentials =
                webAuthRepository.findByUserHandle(userHandle.getBase64Url())
                        .stream()
                        .map(c -> {
                            try {
                                return PublicKeyCredentialDescriptor.builder()
                                        .id(ByteArray.fromBase64Url(c.getCredentialId()))
                                        .type(PublicKeyCredentialType.PUBLIC_KEY)
                                        .build();
                            } catch (Base64UrlException e) {
                                throw new RuntimeException(e);
                            }
                        })
                        .toList();

        StartAssertionOptions options = StartAssertionOptions.builder()
                .userVerification(UserVerificationRequirement.PREFERRED)
                .build();

        // Tworzymy request do przeglądarki
        AssertionRequest request = relyingParty.startAssertion(options);

        // Uzupełniamy request o dozwolone credentiale
        AssertionRequest enriched = request.toBuilder()
                .publicKeyCredentialRequestOptions(
                        request.getPublicKeyCredentialRequestOptions()
                                .toBuilder()
                                .allowCredentials(allowCredentials)
                                .build()
                )
                .build();

        // Zapis w Redis
        redisService.saveAssertionRequest(userHandle.getBase64Url(), enriched);

        return enriched.getPublicKeyCredentialRequestOptions();
    }

    @Transactional
    public boolean finishAssertion(String json, HttpServletResponse httpServletResponse, HttpServletRequest httpServletRequest)
            throws IOException, AssertionFailedException {
        rateLimiter.consumeOrThrow(getClientIp(httpServletRequest), RateLimitOperation.WEBAUTH_ASSERTION);

        PublicKeyCredential<AuthenticatorAssertionResponse, ClientAssertionExtensionOutputs> response =
                PublicKeyCredential.parseAssertionResponseJson(json);

        // userHandle zawsze zwracany przez authenticator
        ByteArray userHandle = response.getResponse()
                .getUserHandle()
                .orElseThrow(() -> new IllegalStateException("Missing userHandle"));

        // Pobranie requestu z Redis
        AssertionRequest request = redisService.getAssertionRequest(userHandle.getBase64Url());

        // Weryfikacja
        AssertionResult result = relyingParty.finishAssertion(
                FinishAssertionOptions.builder()
                        .request(request)
                        .response(response)
                        .build()
        );

        if (!result.isSuccess()) return false;


        // Aktualizacja countera w DB
        webAuthRepository.updateSignatureCount(
                response.getId().getBase64Url(),
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

        redisService.delete(userHandle.getBase64Url());
        return true;
    }

    private void successLogin(String email, HttpServletResponse httpServletResponse, HttpServletRequest httpServletRequest) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AuthenticationException(AuthError.INVALID_CREDENTIALS.name()));

        if (!user.getStatus().equals(AccountStatus.ACTIVE) && !user.getStatus().equals(AccountStatus.PENDING_VERIFICATION)) {
            throw new AuthenticationException(AuthError.ACCOUNT_LOCKED.name());
        }
        sessionManager.createSuccessLoginSession(user, httpServletRequest, httpServletResponse, true);
        sessionManager.create2FASuccessSession(user, httpServletRequest, httpServletResponse);
    }

}
