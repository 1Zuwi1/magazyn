package com.github.dawid_stolarczyk.magazyn.Security.Auth;

import com.github.dawid_stolarczyk.magazyn.Model.Enums.Status2FA;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;

@RedisHash(value = "session")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class SessionData {
    @Id
    private String sessionId;

    private Long userId;
    private Status2FA status2FA;
    private String ip;
    private String userAgent;
}
