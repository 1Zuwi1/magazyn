package com.github.dawid_stolarczyk.magazyn.Services;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.UserInfoResponse;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Repositories.UserRepository;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.AuthUtil;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.RateLimitOperation;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import static com.github.dawid_stolarczyk.magazyn.Utils.InternetUtils.getClientIp;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private Bucket4jRateLimiter rateLimiter;

    public UserInfoResponse getBasicInformation(HttpServletRequest request) {
        rateLimiter.consumeOrThrow(getClientIp(request), RateLimitOperation.USER_ACTION_FREE);
        User user = userRepository.findById(AuthUtil.getCurrentAuthPrincipal().getUserId()).orElseThrow(() -> new RuntimeException("User not found"));
        return new UserInfoResponse(
                user.getId().intValue(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(),
                user.getStatus().name());
    }

}
