package com.github.dawid_stolarczyk.magazyn.Controller;

import com.github.dawid_stolarczyk.magazyn.Common.Enums.AuthError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ResponseTemplate;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.WebAuthnFinishRequest;
import com.github.dawid_stolarczyk.magazyn.Services.WebAuthnService;
import com.yubico.webauthn.data.PublicKeyCredentialCreationOptions;
import com.yubico.webauthn.data.PublicKeyCredentialRequestOptions;
import com.yubico.webauthn.data.exception.Base64UrlException;
import com.yubico.webauthn.exception.AssertionFailedException;
import com.yubico.webauthn.exception.RegistrationFailedException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping("/webauthn")
@Tag(name = "WebAuthn (Passkeys)", description = "Endpoints for passwordless authentication using FIDO2/WebAuthn")
@RequiredArgsConstructor
@Slf4j
public class WebAuthnController {

    private final WebAuthnService webAuthnService;

    /* ===================== REGISTRATION ===================== */

    @Operation(summary = "Initiate passkey registration for the current user.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Registration options generated successfully",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessData.class))),
            @ApiResponse(responseCode = "500", description = "Registration initiation failed",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping("/register/start")
    public ResponseEntity<ResponseTemplate<PublicKeyCredentialCreationOptions>> startRegistration(HttpServletRequest httpServletRequest) {
        try {
            PublicKeyCredentialCreationOptions options = webAuthnService.startRegistration(httpServletRequest);
            return ResponseEntity.ok(ResponseTemplate.success(options));
        } catch (Exception e) {
            log.error("Failed to start WebAuthn registration", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ResponseTemplate.error(AuthError.INVALID_PASSKEY_REGISTRATION.name()));
        }
    }

    // Finish registration → przyjmuje JSON credential z frontendu
    @Operation(summary = "Complete passkey registration with the credential received from the browser.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Registration completed successfully",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class))),
            @ApiResponse(responseCode = "400", description = "Registration verification failed",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "500", description = "Unexpected error during registration",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping("/register/finish")
    public ResponseEntity<ResponseTemplate<Void>> finishRegistration(
            @Valid @RequestBody WebAuthnFinishRequest finishRequest,
            HttpServletRequest httpServletRequest
    ) {
        try {
            webAuthnService.finishRegistration(finishRequest.getCredentialJson(), httpServletRequest);
            return ResponseEntity.ok(ResponseTemplate.success());
        } catch (IOException | RegistrationFailedException | Base64UrlException e) {
            log.error("Failed to verify WebAuthn registration", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ResponseTemplate.error(AuthError.INVALID_PASSKEY_REGISTRATION.name()));
        } catch (Exception e) {
            log.error("Unexpected error finishing WebAuthn registration", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ResponseTemplate.error(AuthError.INVALID_PASSKEY_REGISTRATION.name()));
        }
    }

    /* ===================== ASSERTION / LOGIN ===================== */

    // Start assertion → zwraca PublicKeyCredentialRequestOptions
    @Operation(summary = "Initiate passkey authentication (login).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Authentication options generated successfully",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessData.class))),
            @ApiResponse(responseCode = "400", description = "Authentication initiation failed",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "500", description = "Unexpected error during authentication initiation",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping("/assertion/start")
    public ResponseEntity<ResponseTemplate<PublicKeyCredentialRequestOptions>> startAssertion(HttpServletRequest httpServletRequest) {
        try {
            PublicKeyCredentialRequestOptions options = webAuthnService.startAssertion(httpServletRequest);
            return ResponseEntity.ok(ResponseTemplate.success(options));
        } catch (Base64UrlException e) {
            log.error("Base64 decoding error during WebAuthn assertion start", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ResponseTemplate.error(AuthError.INVALID_PASSKEY_ASSERTION.name()));
        } catch (Exception e) {
            log.error("Unexpected error starting WebAuthn assertion", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ResponseTemplate.error(AuthError.INVALID_PASSKEY_ASSERTION.name()));
        }
    }


    // Finish assertion → przyjmuje credential JSON z frontendu
    @Operation(summary = "Complete passkey authentication and log in the user.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Authentication successful and user logged in",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication verification failed",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "400", description = "Bad request - invalid format",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "500", description = "Unexpected error during authentication completion",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping("/assertion/finish")
    public ResponseEntity<ResponseTemplate<Void>> finishAssertion(@Valid @RequestBody WebAuthnFinishRequest finishRequest,
                                                                  HttpServletResponse httpServletResponse,
                                                                  HttpServletRequest httpServletRequest) {
        try {
            boolean success = webAuthnService.finishAssertion(finishRequest.getCredentialJson(), httpServletResponse, httpServletRequest);
            if (success) {
                return ResponseEntity.ok(ResponseTemplate.success());
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ResponseTemplate.error(AuthError.INVALID_PASSKEY_ASSERTION.name()));
            }
        } catch (IOException | AssertionFailedException e) {
            log.error("WebAuthn assertion verification failed", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ResponseTemplate.error(AuthError.INVALID_PASSKEY_ASSERTION.name()));
        } catch (Exception e) {
            log.error("Unexpected error finishing WebAuthn assertion", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ResponseTemplate.error(AuthError.INVALID_PASSKEY_ASSERTION.name()));
        }
    }
}
