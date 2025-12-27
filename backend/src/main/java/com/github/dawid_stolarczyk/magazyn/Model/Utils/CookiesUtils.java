package com.github.dawid_stolarczyk.magazyn.Model.Utils;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseCookie;

public class CookiesUtils {
    private static final String cookieDomain = "localhost";

    public static void setCookie(HttpServletResponse response, String name, String value, int maxAge) {
        ResponseCookie cookie = ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(maxAge)
                .sameSite("Lax")
                .domain(cookieDomain)
                .build();

        response.addHeader("Set-Cookie", cookie.toString());
    }
    public static void setSessionCookie(HttpServletResponse response, String name, String value) {
        ResponseCookie cookie = ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .sameSite("Lax")
                .domain(cookieDomain)
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
