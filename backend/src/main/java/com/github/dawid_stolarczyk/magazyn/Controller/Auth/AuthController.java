package com.github.dawid_stolarczyk.magazyn.Controller.Auth;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.LoginRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.RegisterRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ResponseTemplate;
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
import org.springframework.web.bind.annotation.*;

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

    @Operation(summary = "Verify email address")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - email verified",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class))),
            @ApiResponse(responseCode = "401", description = "Error codes: TOKEN_INVALID, TOKEN_EXPIRED, EMAIL_NOT_VERIFIED",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @GetMapping("/verify-email")
    public ResponseEntity<ResponseTemplate<Void>> verifyEmail(@RequestParam("token") String token,
                                                              HttpServletRequest request) {
        try {
            authService.verifyEmailCheck(token, request);
            return ResponseEntity.ok(ResponseTemplate.success());
        } catch (AuthenticationException e) {
            log.error("Email verification failed for token: {}", token, e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ResponseTemplate.error(e.getCode()));
        }
    }

}
