package com.github.dawid_stolarczyk.magazyn.Controller;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.LoginRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.RegisterRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ResponseTemplate;
import com.github.dawid_stolarczyk.magazyn.Exception.AuthenticationException;
import com.github.dawid_stolarczyk.magazyn.Services.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {
    @Autowired
    private AuthService authService;
    @Autowired
    private HttpServletRequest request;

    @Operation(summary = "Logout the current user by invalidating their session.")
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response, @CookieValue(name = "refresh-token", required = false) String refreshToken) {
        authService.logoutUser(response, request, refreshToken);
        return ResponseEntity.ok(new ResponseTemplate<>(true, "Logged out successfully"));
    }

    @Operation(summary = "Login a user with provided credentials.")
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest, HttpServletResponse response) {
        try {
            authService.loginUser(loginRequest, response, request);
            return ResponseEntity.ok(new ResponseTemplate<>(true, "Logged in successfully"));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ResponseTemplate<>(false, e.getCode(), e.getMessage()));
        }
    }

    @Operation(summary = "Register a new user with provided credentials.")
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest registerRequest, HttpServletResponse response) {
        try {
            authService.registerUser(registerRequest, request);
            return ResponseEntity.ok(new ResponseTemplate<>(true, "Registered successfully"));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ResponseTemplate<>(false, e.getCode(), e.getMessage()));
        }
    }

    @Operation(summary = "Verify user's email using a verification token.")
    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam("token") String token) {
        try {
            authService.verifyEmailCheck(token, request);
            return ResponseEntity.ok(new ResponseTemplate<>(true, "Email verified successfully"));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ResponseTemplate<>(false, e.getCode(), e.getMessage()));
        }
    }

}
