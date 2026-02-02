package com.github.dawid_stolarczyk.magazyn;

import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.AuthRateLimitProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@EnableConfigurationProperties(AuthRateLimitProperties.class)
@EnableScheduling
public class MagazynApplication {

    public static void main(String[] args) {
        TimeZone.setDefault(TimeZone.getTimeZone("Europe/Warsaw"));
        SpringApplication.run(MagazynApplication.class, args);
    }

}
