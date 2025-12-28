package com.github.dawid_stolarczyk.magazyn.Model.Security;

import com.github.dawid_stolarczyk.magazyn.Model.Entities.UserRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Map;

@Component
public class JwtUtil {
    @Value("${jwt.secret}")
    private String SECRET_KEY;

    public SecretKey getSecretKey() {
        return Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
    }

    public String generateToken(Long id, Status2FA status2FA, long expirationTimeMillis) {
        SecretKey key = getSecretKey();
        Map<String, Object> claims = Map.of("id", id, "status_2fa", status2FA.name());
        return Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationTimeMillis))
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
            return UserRole.valueOf(claims.get("status_2fa").toString()).name();
        } catch (Exception e) {
            return null;
        }
    }
    public Date extractExpiration(String token) {
        Claims claims = extractAllClaims(token);
        if (claims == null) return null;
        return claims.getExpiration();
    }


    public static Long getCurrentIdByAuthentication() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            throw new RuntimeException("No authenticated user found");
        }

        Object principal = auth.getPrincipal();

        if (principal instanceof Long) {
            return (Long) principal;
        }

        throw new RuntimeException("Unsupported principal type: " + principal.getClass());
    }
}
