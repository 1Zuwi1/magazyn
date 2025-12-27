package com.github.dawid_stolarczyk.magazyn.Controller;

import com.github.dawid_stolarczyk.magazyn.Controller.DTOs.LoginRegisterRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.DTOs.ResponseTemplate;
import com.github.dawid_stolarczyk.magazyn.Model.Services.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.parameters.P;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {
    @Autowired
    private AuthService authService;
    @Autowired
    private HttpServletRequest request;

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        try {
            authService.logoutUser(response, request);
            return ResponseEntity.ok(new ResponseTemplate<>(true, "Logged out successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ResponseTemplate<>(false, e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(LoginRegisterRequest loginRequest, HttpServletResponse response) {
        try {
            authService.loginUser(loginRequest, response);
            return ResponseEntity.ok(new ResponseTemplate<>(true, "Logged in successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ResponseTemplate<>(false, e.getMessage()));
        }
    }
    @PostMapping("/register")
    public ResponseEntity<?> register(LoginRegisterRequest registerRequest, HttpServletResponse response) {
        try {
            authService.registerUser(registerRequest, request, response);
            return ResponseEntity.ok(new ResponseTemplate<>(true, "Registered successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ResponseTemplate<>(false, e.getMessage()));
        }
    }

}
