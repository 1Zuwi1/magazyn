package com.github.dawid_stolarczyk.magazyn.Security;

import com.github.dawid_stolarczyk.magazyn.Common.Enums.AuthError;
import com.github.dawid_stolarczyk.magazyn.Exception.AuthenticationException;
import com.github.dawid_stolarczyk.magazyn.Exception.AuthenticationNotFoundException;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.Status2FA;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.AuthPrincipal;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

@Component
public class JwtUtil {
    @Value("${jwt.secret}")
    private String SECRET_KEY;

    public SecretKey getSecretKey() {
        if (SECRET_KEY == null || SECRET_KEY.trim().isEmpty()) {
            throw new IllegalStateException("JWT secret key is not configured or is empty");
        }
        byte[] keyBytes = SECRET_KEY.getBytes(StandardCharsets.UTF_8);
        // Ensure key length is at least 32 bytes (256 bits) for HMAC-SHA algorithms
        if (keyBytes.length < 32) {
            throw new IllegalStateException("JWT secret key must be at least 32 bytes (256 bits) when UTF-8 encoded");
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(Long id, Status2FA status2FA, long expirationSeconds) {
        SecretKey key = getSecretKey();
        Map<String, Object> claims;
        if (status2FA == null) {
            claims = Map.of("id", id);
        } else {
            claims = Map.of("id", id, "status_2fa", status2FA.name());
        }
        return Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationSeconds * 1000))
                .signWith(key)
                .compact();
    }

    private Claims extractAllClaims(String token) {
        SecretKey key = getSecretKey();
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (JwtException e) {
            return null;
        }
    }

    public Long extractUserId(String token) {
        try {
            Claims claims = extractAllClaims(token);
            if (claims == null) return null;
            if (claims.get("id") instanceof Integer integerValue) {
                return Long.valueOf(integerValue);
            }
            if (claims.get("id") instanceof Long longValue) {
                return longValue;
            }
            return null;
        } catch (JwtException e) {
            return null;
        }
    }

    public String extract2FaStatus(String token) {
        Claims claims = extractAllClaims(token);
        if (claims == null) return null;
        try {
            return Status2FA.valueOf(claims.get("status_2fa").toString()).name();
        } catch (Exception e) {
            return null;
        }
    }

    public Date extractExpiration(String token) {
        Claims claims = extractAllClaims(token);
        if (claims == null) return null;
        try {
            if (claims.getExpiration() == null) {
                throw new JwtException("Token does not have an expiration date");
            }
        } catch (Exception e) {
            return null;
        }
        return claims.getExpiration();
    }
    public boolean isTokenValid(String token) {
        try {
            Claims claims = extractAllClaims(token);
            if (claims == null) return false;
            Date expiration = claims.getExpiration();
            return expiration != null && expiration.after(new Date());
        } catch (JwtException e) {
            return false;
        }
    }


    public static AuthPrincipal getCurrentAuthPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            throw new AuthenticationNotFoundException();
        }

        Object principal = auth.getPrincipal();

        if (principal instanceof AuthPrincipal) {
            return (AuthPrincipal) principal;
        }

        throw new AuthenticationException(AuthError.NOT_AUTHENTICATED.name());
    }
    public static AuthPrincipal getCurrentAuthPrincipal(Authentication authentication) {
        assert authentication != null;
        Object principal = authentication.getPrincipal();

        if (principal instanceof AuthPrincipal) {
            return (AuthPrincipal) principal;
        }

        return null;
    }
}
