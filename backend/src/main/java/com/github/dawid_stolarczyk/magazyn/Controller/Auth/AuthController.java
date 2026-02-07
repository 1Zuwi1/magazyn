package com.github.dawid_stolarczyk.magazyn.Controller.Auth;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.*;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ForgotPasswordRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ResetPasswordRequest;
import com.github.dawid_stolarczyk.magazyn.Exception.AuthenticationException;
import com.github.dawid_stolarczyk.magazyn.Services.Auth.AuthService;
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

@RestController
@RequestMapping("/auth")
@Tag(name = "Authentication", description = "Endpoints for user authentication and session management")
@RequiredArgsConstructor
@Slf4j
public class AuthController {
    private final AuthService authService;

    @Operation(summary = "Logout current user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - session invalidated",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class)))
    })
    @PostMapping("/logout")
    public ResponseEntity<ResponseTemplate<Void>> logout(HttpServletResponse response, HttpServletRequest request) {
        authService.logoutUser(response, request);
        return ResponseEntity.ok(ResponseTemplate.success());
    }

    @Operation(summary = "Login user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - logged in (may require 2FA)",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class))),
            @ApiResponse(responseCode = "401", description = "Error codes: INVALID_CREDENTIALS, ACCOUNT_LOCKED, EMAIL_NOT_VERIFIED",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping("/login")
    public ResponseEntity<ResponseTemplate<Void>> login(@Valid @RequestBody LoginRequest loginRequest,
                                                        HttpServletResponse response,
                                                        HttpServletRequest request) {
        try {
            authService.loginUser(loginRequest, response, request);
            return ResponseEntity.ok(ResponseTemplate.success());
        } catch (AuthenticationException e) {
            log.error("Login failed for user: {}", loginRequest.getEmail(), e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ResponseTemplate.error(e.getCode()));
        }
    }

    @Operation(summary = "Register new user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - registered, verification email sent",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class))),
            @ApiResponse(responseCode = "401", description = "Error codes: EMAIL_TAKEN, WEAK_PASSWORD, INVALID_INPUT",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping("/register")
    public ResponseEntity<ResponseTemplate<Void>> register(@Valid @RequestBody RegisterRequest registerRequest,
                                                           HttpServletResponse response,
                                                           HttpServletRequest request) {
        try {
            authService.registerUser(registerRequest, request);
            return ResponseEntity.ok(ResponseTemplate.success());
        } catch (AuthenticationException e) {
            log.error("Registration failed for email: {}", registerRequest.getEmail(), e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ResponseTemplate.error(e.getCode()));
        }
    }

    @Operation(summary = "Verify email address",
            description = "Verifies user email with the token sent in the verification email. Token is provided in request body.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - email verified",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: TOKEN_INVALID, TOKEN_EXPIRED",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "401", description = "Error codes: EMAIL_NOT_VERIFIED",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping("/verify-email")
    public ResponseEntity<ResponseTemplate<Void>> verifyEmail(@Valid @RequestBody VerifyEmailRequest request,
                                                              HttpServletRequest httpRequest) {
        try {
            authService.verifyEmailCheck(request.getToken(), httpRequest);
            return ResponseEntity.ok(ResponseTemplate.success());
        } catch (AuthenticationException e) {
            log.warn("Email verification failed: {}", e.getCode());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ResponseTemplate.error(e.getCode()));
        }
    }

    @Operation(summary = "Request password reset",
            description = "Sends a password reset link to the provided email address if a user with that email exists.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - password reset email sent (or email not found, for security)",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: INVALID_INPUT",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping("/forgot-password")
    public ResponseEntity<ResponseTemplate<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request,
                                                                  HttpServletRequest httpRequest) {
        try {
            authService.forgotPassword(request.getEmail(), httpRequest);
            return ResponseEntity.ok(ResponseTemplate.success());
        } catch (AuthenticationException e) {
            // For security reasons, we return success even if email doesn't exist
            // to prevent email enumeration attacks
            log.warn("Forgot password request: {}", e.getCode());
            return ResponseEntity.ok(ResponseTemplate.success());
        }
    }

    @Operation(summary = "Reset password with token",
            description = "Resets user password using the token received in the password reset email.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - password reset",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: RESET_TOKEN_INVALID, RESET_TOKEN_EXPIRED, WEAK_PASSWORD",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping("/reset-password")
    public ResponseEntity<ResponseTemplate<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request,
                                                                 HttpServletRequest httpRequest) {
        try {
            authService.resetPassword(request.getToken(), request.getNewPassword(), httpRequest);
            return ResponseEntity.ok(ResponseTemplate.success());
        } catch (AuthenticationException e) {
            log.warn("Password reset failed: {}", e.getCode());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ResponseTemplate.error(e.getCode()));
        }
    }

}
