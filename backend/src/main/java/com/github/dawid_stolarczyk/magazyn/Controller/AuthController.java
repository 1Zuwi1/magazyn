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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {
    @Autowired
    private AuthService authService;
    @Autowired
    private HttpServletRequest request;

    @Operation(summary = "Logout the current user by invalidating their session.")
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        try {
            authService.logoutUser(response, request);
            return ResponseEntity.ok(new ResponseTemplate<>(true, "Logged out successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ResponseTemplate<>(false, e.getMessage()));
        }
    }

    @Operation(summary = "Login a user with provided credentials.")
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest, HttpServletResponse response) {
        try {
            authService.loginUser(loginRequest, response, request);
            return ResponseEntity.ok(new ResponseTemplate<>(true, "Logged in successfully"));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ResponseTemplate<>(false, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ResponseTemplate<>(false, e.getMessage()));
        }
    }
    @Operation(summary = "Register a new user with provided credentials.")
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest registerRequest, HttpServletResponse response) {
        try {
            authService.registerUser(registerRequest, request);
            return ResponseEntity.ok(new ResponseTemplate<>(true, "Registered successfully"));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ResponseTemplate<>(false, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ResponseTemplate<>(false, e.getMessage()));
        }
    }

}
