package com.github.dawid_stolarczyk.magazyn.Services;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.UserInfoResponse;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Repositories.UserRepository;
import com.github.dawid_stolarczyk.magazyn.Security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;


    public UserInfoResponse getBasicInformation() {
        User user = userRepository.findById(JwtUtil.getCurrentIdByAuthentication()).orElseThrow(() -> new RuntimeException("User not found"));
        return new UserInfoResponse(
                user.getId().intValue(),
                user.getFullName(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().name(),
                user.getStatus().name());
    }

}
