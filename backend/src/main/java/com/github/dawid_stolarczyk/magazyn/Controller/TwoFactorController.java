package com.github.dawid_stolarczyk.magazyn.Controller;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.CodeRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ResponseTemplate;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.TwoFactorAuthenticatorResponse;
import com.github.dawid_stolarczyk.magazyn.Exception.AuthenticationException;
import com.github.dawid_stolarczyk.magazyn.Services.TwoFactorService;
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
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/2fa")
@Tag(name = "Two-Factor Authentication", description = "Endpoints for managing 2FA methods and verification")
@RequiredArgsConstructor
@Slf4j
public class TwoFactorController {
    private final TwoFactorService twoFactorService;
    private final HttpServletRequest request;
    private final HttpServletResponse response;

    @Operation(summary = "Retrieve the current user's two-factor authentication methods.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved two-factor methods",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessData.class))),
            @ApiResponse(responseCode = "400", description = "Bad request",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @GetMapping
    public ResponseEntity<ResponseTemplate<List<String>>> twoFactorMethods() {
        return ResponseEntity.ok(ResponseTemplate.success(twoFactorService.getUsersTwoFactorMethods(request)));
    }

    @Operation(summary = "Send a two-factor authentication code via email to the current user.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "2FA code sent successfully via email",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class)))
    })
    @PostMapping("/email/send")
    public ResponseEntity<ResponseTemplate<Void>> sendEmailCode() {
        twoFactorService.sendTwoFactorCodeViaEmail(request);
        return ResponseEntity.ok(ResponseTemplate.success());
    }

    @Operation(summary = "Generate a new Google Authenticator secret for the current user.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully generated authenticator secret",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessData.class)))
    })
    @PostMapping("/authenticator/start")
    public ResponseEntity<ResponseTemplate<TwoFactorAuthenticatorResponse>> generateAuthenticatorSecret() {
        return ResponseEntity.ok(ResponseTemplate.success(twoFactorService.generateTwoFactorGoogleSecret(request)));
    }

    @PostMapping("/backup-codes/generate")
    @Operation(summary = "Generate new backup codes for the current user.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully generated backup codes",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessData.class))),
            @ApiResponse(responseCode = "400", description = "Generation failed",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    public ResponseEntity<ResponseTemplate<List<String>>> generateBackupCodes() {
        try {
            return ResponseEntity.ok(ResponseTemplate.success(twoFactorService.generateBackupCodes(request)));
        } catch (AuthenticationException e) {
            log.error("Failed to generate backup codes", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ResponseTemplate.error(e.getCode()));
        }
    }

    @Operation(summary = "Check the provided two-factor authentication code for the current user.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "2FA code verified successfully",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or expired code",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping("/check")
    public ResponseEntity<ResponseTemplate<Void>> checkCode(@Valid @RequestBody CodeRequest codeRequest) {
        try {
            twoFactorService.checkCode(codeRequest, request, response);
            return ResponseEntity.ok(ResponseTemplate.success());
        } catch (AuthenticationException e) {
            log.error("2FA check failed for user session", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ResponseTemplate.error(e.getCode()));
        }
    }
}
