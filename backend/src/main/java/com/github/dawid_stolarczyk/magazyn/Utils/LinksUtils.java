package com.github.dawid_stolarczyk.magazyn.Utils;


import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@Component
public class LinksUtils {
    @Value("${app.url}")
    private String webAppUrl;

    private static String webAppUrlStatic;

    @PostConstruct
    public void init() {
        webAppUrlStatic = webAppUrl;
    }

    public static String getWebAppUrl(String path, HttpServletRequest request) {
        String finalUrl = null;
        if (path != null && !path.isEmpty()) {
            if (webAppUrlStatic != null) {
                finalUrl = webAppUrlStatic.endsWith("/") ? webAppUrlStatic + path : webAppUrlStatic + "/" + path;
            } else if (request != null) {
                finalUrl = ServletUriComponentsBuilder.fromContextPath(request)
                        .replacePath(null)
                        .path(path)
                        .toUriString();
            }
        }
        return finalUrl;
    }
}
