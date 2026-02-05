package com.github.dawid_stolarczyk.magazyn.Config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.redis.repository.configuration.EnableRedisRepositories;

@Configuration
@EnableJpaRepositories(basePackages = "com.github.dawid_stolarczyk.magazyn.Repositories.JPA")
@EnableRedisRepositories(basePackages = "com.github.dawid_stolarczyk.magazyn.Repositories.Redis")
public class DbConfig {
}
