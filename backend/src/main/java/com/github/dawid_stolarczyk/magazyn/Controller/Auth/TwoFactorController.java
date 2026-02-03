package com.github.dawid_stolarczyk.magazyn.Controller.Auth;

import com.github.dawid_stolarczyk.magazyn.Common.Enums.AuthError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.Auth.PasskeyRenameRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.*;
import com.github.dawid_stolarczyk.magazyn.Exception.AuthenticationException;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.WebAuthnCredential;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.Default2faMethod;
import com.github.dawid_stolarczyk.magazyn.Services.Auth.TwoFactorService;
import com.github.dawid_stolarczyk.magazyn.Services.Auth.WebAuthnService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/2fa")
@Tag(name = "Two-Factor Authentication", description = "Endpoints for managing 2FA methods and verification")
@Slf4j
public class TwoFactorController {
    private final TwoFactorService twoFactorService;
    private final WebAuthnService webAuthnService;

    public TwoFactorController(TwoFactorService twoFactorService, WebAuthnService webAuthnService) {
        this.twoFactorService = twoFactorService;
        this.webAuthnService = webAuthnService;
    }

    @Operation(summary = "Get user's 2FA methods and passkeys")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - returns enabled 2FA methods and passkey list",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = TwoFactorMethodsResponse.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: BAD_REQUEST",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @GetMapping
    public ResponseEntity<ResponseTemplate<TwoFactorMethodsResponse>> twoFactorMethods(HttpServletRequest request) {
        return ResponseEntity.ok(ResponseTemplate.success(twoFactorService.getUsersTwoFactorMethods(request)));
    }

    @Operation(summary = "Send 2FA code via email")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - code sent to email",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: UNSUPPORTED_2FA_METHOD",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "401", description = "Error codes: NOT_AUTHENTICATED",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "403", description = "Error codes: INSUFFICIENT_PERMISSIONS",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping("/send")
    public ResponseEntity<ResponseTemplate<Void>> sendCode(@Valid @RequestBody SendTwoFactorCodeRequest sendRequest,
                                                           HttpServletRequest request) {
        try {
            if (sendRequest.getMethod() != Default2faMethod.EMAIL) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ResponseTemplate.error(AuthError.UNSUPPORTED_2FA_METHOD.name()));
            }
            twoFactorService.sendTwoFactorCodeViaEmail(request);
            return ResponseEntity.ok(ResponseTemplate.success());
        } catch (AuthenticationException e) {
            log.error("Failed to send 2FA code for method: {}", sendRequest.getMethod(), e);
            HttpStatus status = getHttpStatusForAuthError(e.getCode());
            return ResponseEntity.status(status).body(ResponseTemplate.error(e.getCode()));
        }
    }

    @Operation(summary = "Generate Google Authenticator secret")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - returns secret and QR code URL",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = TwoFactorAuthenticatorResponse.class)))
    })
    @PostMapping("/authenticator/start")
    public ResponseEntity<ResponseTemplate<TwoFactorAuthenticatorResponse>> generateAuthenticatorSecret(HttpServletRequest request) {
        return ResponseEntity.ok(ResponseTemplate.success(twoFactorService.generateTwoFactorGoogleSecret(request)));
    }

    @Operation(summary = "Generate backup codes")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - returns list of backup codes",
                    content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = String.class, example = "7DFK-93NX")))),
            @ApiResponse(responseCode = "401", description = "Error codes: NOT_AUTHENTICATED",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "403", description = "Error codes: INSUFFICIENT_PERMISSIONS",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping("/backup-codes/generate")
    public ResponseEntity<ResponseTemplate<List<String>>> generateBackupCodes(HttpServletRequest request) {
        try {
            return ResponseEntity.ok(ResponseTemplate.success(twoFactorService.generateBackupCodes(request)));
        } catch (AuthenticationException e) {
            log.error("Failed to generate backup codes", e);
            HttpStatus status = getHttpStatusForAuthError(e.getCode());
            return ResponseEntity.status(status).body(ResponseTemplate.error(e.getCode()));
        }
    }

    @Operation(summary = "Verify 2FA code")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - code verified",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class))),
            @ApiResponse(responseCode = "401", description = "Error codes: INVALID_OR_EXPIRED_CODE, CODE_FORMAT_INVALID",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping("/check")
    public ResponseEntity<ResponseTemplate<Void>> checkCode(@Valid @RequestBody CodeRequest codeRequest,
                                                            HttpServletRequest request,
                                                            HttpServletResponse response) {
        try {
            twoFactorService.checkCode(codeRequest, request, response);
            return ResponseEntity.ok(ResponseTemplate.success());
        } catch (AuthenticationException e) {
            log.error("2FA check failed for user session", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ResponseTemplate.error(e.getCode()));
        }
    }

    @Operation(summary = "Remove 2FA method (EMAIL cannot be removed)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - method removed",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: INVALID_INPUT, UNSUPPORTED_2FA_METHOD",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "403", description = "Error codes: INSUFFICIENT_PERMISSIONS",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @DeleteMapping("/methods")
    public ResponseEntity<ResponseTemplate<Void>> removeTwoFactorMethod(@Valid @RequestBody RemoveTwoFactorMethodRequest removeRequest,
                                                                        HttpServletRequest request) {
        try {
            twoFactorService.removeTwoFactorMethod(removeRequest.getMethod(), request);
            return ResponseEntity.ok(ResponseTemplate.success());
        } catch (AuthenticationException e) {
            log.error("Failed to remove 2FA method: {}", removeRequest.getMethod(), e);
            HttpStatus status = getHttpStatusForAuthError(e.getCode());
            return ResponseEntity.status(status).body(ResponseTemplate.error(e.getCode()));
        }
    }

    @Operation(summary = "Set default 2FA method")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - default method updated",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: METHOD_NOT_ENABLED, UNSUPPORTED_2FA_METHOD",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "403", description = "Error codes: INSUFFICIENT_PERMISSIONS",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PatchMapping("/default")
    public ResponseEntity<ResponseTemplate<Void>> setDefaultMethod(@Valid @RequestBody SetDefault2faMethodRequest setDefaultRequest,
                                                                   HttpServletRequest request) {
        try {
            twoFactorService.setDefaultTwoFactorMethod(setDefaultRequest.getMethod(), request);
            return ResponseEntity.ok(ResponseTemplate.success());
        } catch (AuthenticationException e) {
            log.error("Failed to set default 2FA method: {}", setDefaultRequest.getMethod(), e);
            HttpStatus status = e.getCode().equals(AuthError.INSUFFICIENT_PERMISSIONS.name()) ? HttpStatus.FORBIDDEN : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(status).body(ResponseTemplate.error(e.getCode()));
        }
    }

    // ===================== PASSKEY ENDPOINTS =====================

    @Operation(summary = "Get user's passkeys")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - returns list of passkeys (id, name, credentialId, email, signatureCount, isDiscoverable)",
                    content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = WebAuthnCredential.class)))),
            @ApiResponse(responseCode = "401", description = "Error codes: NOT_AUTHENTICATED",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "500", description = "Error codes: INTERNAL_ERROR",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @GetMapping("/passkeys")
    public ResponseEntity<ResponseTemplate<List<WebAuthnCredential>>> getPasskeys() {
        try {
            List<WebAuthnCredential> passkeys = webAuthnService.getMyPasskeys();
            return ResponseEntity.ok(ResponseTemplate.success(passkeys));
        } catch (AuthenticationException e) {
            String errorCode = e.getCode();
            log.warn("Failed to get passkeys: {}", errorCode);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ResponseTemplate.error(errorCode));
        } catch (Exception e) {
            log.error("Unexpected error while getting passkeys", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseTemplate.error(AuthError.INTERNAL_ERROR.name()));
        }
    }

    @Operation(summary = "Delete passkey (requires sudo mode)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - passkey deleted",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class))),
            @ApiResponse(responseCode = "403", description = "Error codes: INSUFFICIENT_PERMISSIONS (sudo mode required)",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "404", description = "Error codes: RESOURCE_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "500", description = "Error codes: INTERNAL_ERROR",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @DeleteMapping("/passkeys/{id}")
    public ResponseEntity<ResponseTemplate<Void>> deletePasskey(@PathVariable Long id) {
        try {
            webAuthnService.deletePasskey(id);
            return ResponseEntity.ok(ResponseTemplate.success());
        } catch (AuthenticationException e) {
            String errorCode = e.getCode();
            log.warn("Failed to delete passkey {}: {}", id, errorCode);

            // Use getCode() instead of getMessage() to avoid NullPointerException
            HttpStatus status = AuthError.RESOURCE_NOT_FOUND.name().equals(errorCode)
                    ? HttpStatus.NOT_FOUND
                    : HttpStatus.FORBIDDEN;

            return ResponseEntity.status(status).body(ResponseTemplate.error(errorCode));
        } catch (Exception e) {
            log.error("Unexpected error while deleting passkey {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseTemplate.error(AuthError.INTERNAL_ERROR.name()));
        }
    }

    @Operation(summary = "Rename passkey (requires sudo mode, name must be unique per user)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - passkey renamed",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: PASSKEY_NAME_ALREADY_EXISTS, INVALID_INPUT",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "403", description = "Error codes: INSUFFICIENT_PERMISSIONS (sudo mode required)",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "404", description = "Error codes: RESOURCE_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "500", description = "Error codes: INTERNAL_ERROR",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PutMapping("/passkeys/{id}/rename")
    public ResponseEntity<ResponseTemplate<Void>> renamePasskey(
            @PathVariable Long id,
            @Valid @RequestBody PasskeyRenameRequest request) {
        try {
            webAuthnService.renamePasskey(id, request.getName());
            return ResponseEntity.ok(ResponseTemplate.success());
        } catch (AuthenticationException e) {
            String errorCode = e.getCode();
            log.warn("Failed to rename passkey {}: {}", id, errorCode);

            HttpStatus status;
            if (AuthError.RESOURCE_NOT_FOUND.name().equals(errorCode)) {
                status = HttpStatus.NOT_FOUND;
            } else if (AuthError.PASSKEY_NAME_ALREADY_EXISTS.name().equals(errorCode) ||
                    AuthError.INVALID_INPUT.name().equals(errorCode)) {
                status = HttpStatus.BAD_REQUEST;
            } else {
                status = HttpStatus.FORBIDDEN;
            }

            return ResponseEntity.status(status).body(ResponseTemplate.error(errorCode));
        } catch (Exception e) {
            log.error("Unexpected error while renaming passkey {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseTemplate.error(AuthError.INTERNAL_ERROR.name()));
        }
    }

    /**
     * Helper method to map authentication error codes to appropriate HTTP status
     */
    private HttpStatus getHttpStatusForAuthError(String errorCode) {
        if (AuthError.INSUFFICIENT_PERMISSIONS.name().equals(errorCode)) {
            return HttpStatus.FORBIDDEN;
        }
        return HttpStatus.UNAUTHORIZED;
    }
}
