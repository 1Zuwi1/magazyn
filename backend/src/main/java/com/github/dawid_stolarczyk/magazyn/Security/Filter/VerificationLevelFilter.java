package com.github.dawid_stolarczyk.magazyn.Security.Filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ResponseTemplate;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AccountStatus;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.Status2FA;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.VerificationLevel;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.UserRepository;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.AuthUtil;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.Entity.AuthPrincipal;
import com.github.dawid_stolarczyk.magazyn.Security.Config.EndpointAccessConfig;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter that enforces hierarchical verification level requirements on endpoints.
 * Replaces separate TwoFactorFilter and NotVerifiedByAdminFilter with centralized logic.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class VerificationLevelFilter extends OncePerRequestFilter {

    private final EndpointAccessConfig endpointAccessConfig;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String uri = request.getRequestURI();
        VerificationLevel requiredLevel = endpointAccessConfig.getRequiredLevel(uri);


        // Public endpoints - no verification needed
        if (requiredLevel == VerificationLevel.PUBLIC) {
            filterChain.doFilter(request, response);
            return;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        // Not authenticated - Spring Security should handle this, but double-check
        if (auth == null || !auth.isAuthenticated()) {
            filterChain.doFilter(request, response);
            return;
        }

        // Get current user's auth principal
        AuthPrincipal authPrincipal = AuthUtil.getCurrentAuthPrincipal();

        // Load user from database
        User user = userRepository.findById(authPrincipal.getUserId())
                .orElse(null);
        if (user == null) {
            rejectRequest(response, "USER_NOT_FOUND");
            return;
        }

        VerificationLevel userLevel = getUserVerificationLevel(user, authPrincipal);

        // Check if user's level satisfies the requirement
        if (!userLevel.satisfies(requiredLevel)) {
            handleInsufficientVerification(response, userLevel, requiredLevel, user, authPrincipal);
            return;
        }

        // User has sufficient verification - proceed
        filterChain.doFilter(request, response);
    }

    /**
     * Determine user's current verification level based on account status and 2FA status.
     */
    private VerificationLevel getUserVerificationLevel(User user, AuthPrincipal authPrincipal) {
        AccountStatus accountStatus = user.getStatus();
        Status2FA status2FA = authPrincipal.getStatus2FA();


        if (status2FA != Status2FA.VERIFIED) {
            return VerificationLevel.VERIFIED_NO_2FA;
        }

        if (accountStatus == AccountStatus.PENDING_VERIFICATION) {
            return VerificationLevel.AUTHENTICATED_UNVERIFIED;
        }

        if (accountStatus == AccountStatus.ACTIVE) {
            return VerificationLevel.FULLY_VERIFIED;
        }

        // Fallback - treat as unverified
        log.warn("Unexpected user state: status={}, 2fa={}, userId={}",
                accountStatus, status2FA, user.getId());
        return VerificationLevel.AUTHENTICATED_UNVERIFIED;
    }

    /**
     * Handle insufficient verification by returning appropriate error response.
     */
    private void handleInsufficientVerification(HttpServletResponse response,
                                                VerificationLevel userLevel,
                                                VerificationLevel requiredLevel,
                                                User user,
                                                AuthPrincipal authPrincipal) throws IOException {
        // Clear security context on authorization failure
        SecurityContextHolder.clearContext();

        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json;charset=UTF-8");

        String errorCode = getErrorCode(user, authPrincipal);

        log.info("Access denied for user {}: level={}, required={}, error={}",
                user.getEmail(), userLevel, requiredLevel, errorCode);

        objectMapper.writeValue(response.getWriter(),
                ResponseTemplate.error(errorCode));
    }

    /**
     * Generate appropriate error code based on what's missing.
     */
    private String getErrorCode(User user, AuthPrincipal authPrincipal) {
        // If admin verification is missing

        // If account is disabled or locked
        if (user.getStatus() == AccountStatus.DISABLED) {
            return "ACCOUNT_DISABLED";
        }
        if (user.getStatus() == AccountStatus.LOCKED) {
            return "ACCOUNT_LOCKED";
        }

        // If only 2FA is missing
        if (authPrincipal.getStatus2FA() != Status2FA.VERIFIED) {
            return "2FA_NOT_VERIFIED";
        }
        
        if (user.getStatus() == AccountStatus.PENDING_VERIFICATION) {
            return "NOT_VERIFIED_BY_ADMIN";
        }

        // Generic insufficient verification
        return "INSUFFICIENT_VERIFICATION";
    }

    /**
     * Helper to reject request with error.
     */
    private void rejectRequest(HttpServletResponse response, String errorCode) throws IOException {
        SecurityContextHolder.clearContext();
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json;charset=UTF-8");
        objectMapper.writeValue(response.getWriter(),
                ResponseTemplate.error(errorCode));
    }
}
