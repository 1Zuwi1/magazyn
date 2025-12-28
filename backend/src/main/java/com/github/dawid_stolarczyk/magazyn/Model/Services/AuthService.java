package com.github.dawid_stolarczyk.magazyn.Model.Services;

import com.github.dawid_stolarczyk.magazyn.Controller.DTOs.LoginRegisterRequest;
import com.github.dawid_stolarczyk.magazyn.Model.Entities.User;
import com.github.dawid_stolarczyk.magazyn.Model.Repositories.UserRepository;
import com.github.dawid_stolarczyk.magazyn.Model.Security.JwtUtil;
import com.github.dawid_stolarczyk.magazyn.Model.Security.Status2FA;
import com.github.dawid_stolarczyk.magazyn.Model.Utils.CookiesUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private EmailService emailService;

    public void logoutUser(HttpServletResponse response, HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            new SecurityContextLogoutHandler().logout(request, response, auth);
        }
        CookiesUtils.setCookie(response, "jwt_token", "", 0);
    }

    public void loginUser(LoginRegisterRequest loginRequest, HttpServletResponse response) {
        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));
        if (!BCrypt.checkpw(loginRequest.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }
        String jwt = jwtUtil.generateToken(user.getId(), Status2FA.PRE_2FA, 3600_000);
        CookiesUtils.setCookie(response, "jwt_token", jwt, 3600);
        emailService.sendTwoFactorCode(user.getEmail(), "012456");
    }

    public void registerUser(LoginRegisterRequest registerRequest, HttpServletRequest request, HttpServletResponse response) {

    }
}
