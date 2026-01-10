package com.github.dawid_stolarczyk.magazyn.Security.Config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "security.jwt")
@Getter @Setter
public class JwtProperties {
    private Duration accessTokenTtl;
    private Duration refreshTokenTtl;
    private Duration twofaCodeTtl;
}
