package com.github.dawid_stolarczyk.magazyn.Controller;

import com.github.dawid_stolarczyk.magazyn.Common.Enums.AuthError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ResponseTemplate;
import com.github.dawid_stolarczyk.magazyn.Services.WebAuthnService;
import com.yubico.webauthn.data.PublicKeyCredentialCreationOptions;
import com.yubico.webauthn.data.PublicKeyCredentialRequestOptions;
import com.yubico.webauthn.data.exception.Base64UrlException;
import com.yubico.webauthn.exception.AssertionFailedException;
import com.yubico.webauthn.exception.RegistrationFailedException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping("/webauthn")
public class WebAuthnController {

    private final WebAuthnService webAuthnService;

    @Autowired
    public WebAuthnController(WebAuthnService webAuthnService) {
        this.webAuthnService = webAuthnService;
    }

    /* ===================== REGISTRATION ===================== */

    // Start registration → zwraca PublicKeyCredentialCreationOptions
    @PostMapping("/register/start")
    public ResponseEntity<?> startRegistration(HttpServletRequest httpServletRequest) {
        try {
            PublicKeyCredentialCreationOptions options = webAuthnService.startRegistration(httpServletRequest);
            return ResponseEntity.ok(new ResponseTemplate<>(true, options));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ResponseTemplate<>(false, AuthError.INVALID_PASSKEY_REGISTRATION));
        }
    }

    // Finish registration → przyjmuje JSON credential z frontendu
    @PostMapping("/register/finish")
    public ResponseEntity<?> finishRegistration(
            @RequestBody String credentialJson,
            HttpServletRequest httpServletRequest
    ) {
        try {
            webAuthnService.finishRegistration(credentialJson, httpServletRequest);
            return ResponseEntity.ok(new ResponseTemplate<>(true, "Registration finished"));
        } catch (IOException | RegistrationFailedException | Base64UrlException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ResponseTemplate<>(false, AuthError.INVALID_PASSKEY_REGISTRATION));
        }
    }

    /* ===================== ASSERTION / LOGIN ===================== */

    // Start assertion → zwraca PublicKeyCredentialRequestOptions
    @PostMapping("/assertion/start")
    public ResponseEntity<?> startAssertion(HttpServletRequest httpServletRequest) {
        try {
            PublicKeyCredentialRequestOptions options = webAuthnService.startAssertion(httpServletRequest);
            return ResponseEntity.ok(new ResponseTemplate<>(true, options));
        } catch (Base64UrlException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ResponseTemplate<>(false, AuthError.INVALID_PASSKEY_ASSERTION));
        }
    }

    // Finish assertion → przyjmuje credential JSON z frontendu
    @PostMapping("/assertion/finish")
    public ResponseEntity<?> finishAssertion(@RequestBody String credentialJson,
                                             HttpServletResponse httpServletResponse,
                                             HttpServletRequest httpServletRequest) {
        try {
            boolean success = webAuthnService.finishAssertion(credentialJson, httpServletResponse, httpServletRequest);
            if (success) {
                return ResponseEntity.ok(new ResponseTemplate<>(true, "Login successful"));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ResponseTemplate<>(false, AuthError.INVALID_PASSKEY_ASSERTION));
            }
        } catch (IOException | AssertionFailedException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ResponseTemplate<>(false, AuthError.INVALID_PASSKEY_ASSERTION));
        }
    }
}
