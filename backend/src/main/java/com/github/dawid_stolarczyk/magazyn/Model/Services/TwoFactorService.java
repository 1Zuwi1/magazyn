package com.github.dawid_stolarczyk.magazyn.Model.Services;

import com.github.dawid_stolarczyk.magazyn.Model.Entities.User;
import com.github.dawid_stolarczyk.magazyn.Model.Repositories.UserRepository;
import com.github.dawid_stolarczyk.magazyn.Model.Security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TwoFactorService {
    @Autowired
    private UserRepository userRepository;

    public List<String> usersTwoFactorMethod() {
        User user = userRepository.findById(JwtUtil.getCurrentIdByAuthentication()).orElseThrow(() -> new RuntimeException("User not found"));
        return user.getTwoFactorMethods().stream().map(method -> method.getMethodName().name()).toList();
    }

}
