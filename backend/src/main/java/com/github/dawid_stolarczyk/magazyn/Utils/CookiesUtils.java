package com.github.dawid_stolarczyk.magazyn.Utils;

import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

@Component
public class CookiesUtils {

    private static String cookieDomainStatic;
    private static Integer authTokenExpirationSecondsStatic;

    @Value("${auth.cookie.domain}")
    private String cookieDomain;

    @Value("${auth.token.expiration-seconds}")
    private Integer authTokenExpirationSeconds;

    @PostConstruct
    public void init() {
        cookieDomainStatic = cookieDomain;
        authTokenExpirationSecondsStatic = authTokenExpirationSeconds;
    }

    public static void setCookie(HttpServletResponse response, String name, String value, Integer maxAge) {
        if (maxAge == null) {
            maxAge = authTokenExpirationSecondsStatic;
        }
        ResponseCookie cookie = ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(maxAge)
                .sameSite("Lax")
                .domain(cookieDomainStatic)
                .build();

        response.addHeader("Set-Cookie", cookie.toString());
    }
    public static String getCookie(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (cookie.getName().equals(name)) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

}
