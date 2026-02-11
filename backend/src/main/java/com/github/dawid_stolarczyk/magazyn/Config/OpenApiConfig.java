package com.github.dawid_stolarczyk.magazyn.Config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.security.SecuritySchemes;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "Magazyn WMS API",
                version = "1.0",
                description = "Warehouse Management System API"
        )
)
@SecuritySchemes({
        @SecurityScheme(
                name = "session-cookie",
                type = SecuritySchemeType.APIKEY,
                in = SecuritySchemeIn.COOKIE,
                paramName = "SESSION",
                description = "Session cookie authentication (for web UI users)"
        ),
        @SecurityScheme(
                name = "api-key",
                type = SecuritySchemeType.APIKEY,
                in = SecuritySchemeIn.HEADER,
                paramName = "X-API-KEY",
                description = "API key authentication (for IoT sensors and external systems)"
        )
})
public class OpenApiConfig {
}
