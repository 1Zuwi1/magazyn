package com.github.dawid_stolarczyk.magazyn.Services;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.LoginRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.RegisterRequest;
import com.github.dawid_stolarczyk.magazyn.Exception.RateLimitExceededException;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AccountStatus;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Common.Enums.AuthError;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.UserRole;
import com.github.dawid_stolarczyk.magazyn.Repositories.UserRepository;
import com.github.dawid_stolarczyk.magazyn.Security.JwtUtil;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.Status2FA;
import com.github.dawid_stolarczyk.magazyn.Utils.CookiesUtils;
import com.github.dawid_stolarczyk.magazyn.Utils.InternetUtils;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.github.dawid_stolarczyk.magazyn.Exception.AuthenticationException;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import static com.github.dawid_stolarczyk.magazyn.Utils.InternetUtils.getClientIp;

@Service
public class AuthService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private JwtUtil jwtUtil;

    @Value("${auth.password.min-length}")
    private int MIN_PASSWORD_LENGTH;

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    private Bucket resolveBucket(String ip) {
        return buckets.computeIfAbsent(ip, k -> Bucket.builder()
                .addLimit(limit -> limit.capacity(5).refillGreedy(5, Duration.ofMinutes(1)))
                .build());
    }


    public void logoutUser(HttpServletResponse response, HttpServletRequest request) {

        if (!resolveBucket(getClientIp(request)).tryConsume(1)) {
            throw new RateLimitExceededException("Too many logout attempts. Please try again later.");
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            new SecurityContextLogoutHandler().logout(request, response, auth);
        }
        CookiesUtils.setCookie(response, "token", "", 0);
    }

    public void loginUser(LoginRequest loginRequest, HttpServletResponse response, HttpServletRequest request) {
        if (!resolveBucket(getClientIp(request)).tryConsume(1)) {
            throw new RateLimitExceededException("Too many logout attempts. Please try again later.");
        }

        User user = userRepository.findByUsername(loginRequest.getUsername())
                .orElseThrow(() -> new AuthenticationException(AuthError.INVALID_CREDENTIALS.name()));
        if (!BCrypt.checkpw(loginRequest.getPassword(), user.getPassword())) {
            throw new AuthenticationException(AuthError.INVALID_CREDENTIALS.name());
        }

        if (!user.getStatus().equals(AccountStatus.ACTIVE)) {
            throw new AuthenticationException(AuthError.ACCOUNT_LOCKED.name());
        }

        String jwt = jwtUtil.generateToken(user.getId(), Status2FA.PRE_2FA);
        CookiesUtils.setCookie(response, "token", jwt, null);
    }

    @Transactional
    public void registerUser(RegisterRequest registerRequest, HttpServletRequest request) throws AuthenticationException {
        if (!resolveBucket(getClientIp(request)).tryConsume(1)) {
            throw new RateLimitExceededException("Too many registration attempts. Please try again later.");
        }

        if (userRepository.findByEmail(registerRequest.getEmail()).isPresent()) {
            throw new AuthenticationException(AuthError.EMAIL_TAKEN.name());
        }
        if (userRepository.findByUsername(registerRequest.getUsername()).isPresent()) {
            throw new AuthenticationException(AuthError.USERNAME_TAKEN.name());
        }
        if (!checkPasswordStrength(registerRequest.getPassword())) {
            throw new AuthenticationException(AuthError.WEAK_PASSWORD.name());
        }
        User newUser = new User();
        newUser.setEmail(registerRequest.getEmail());
        newUser.setRawPassword(registerRequest.getPassword());
        newUser.setFullName(registerRequest.getFullName());
        newUser.setUsername(registerRequest.getUsername());
        newUser.setRole(UserRole.USER);
        newUser.setStatus(AccountStatus.ACTIVE);
        userRepository.save(newUser);
    }

    private boolean checkPasswordStrength(String password) {
        if (password.length() < MIN_PASSWORD_LENGTH)
            return false;
        boolean hasUpper = false, hasLower = false, hasDigit = false, hasSpecial = false;
        for (char c : password.toCharArray()) {
            if (Character.isUpperCase(c))
                hasUpper = true;
            else if (Character.isLowerCase(c))
                hasLower = true;
            else if (Character.isDigit(c))
                hasDigit = true;
            else
                hasSpecial = true;
        }
        return hasUpper && hasLower && hasDigit && hasSpecial;
    }
}
