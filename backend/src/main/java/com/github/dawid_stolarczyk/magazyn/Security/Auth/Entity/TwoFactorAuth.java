package com.github.dawid_stolarczyk.magazyn.Security.Auth.Entity;

import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.redis.core.RedisHash;

@RedisHash(value = "2fa_auth")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class TwoFactorAuth {
    @Id
    private String id;
    private Long userId;
    private String ipAddress;
    private String userAgent;
}
