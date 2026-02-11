package com.github.dawid_stolarczyk.magazyn.Utils;

import jakarta.servlet.http.HttpServletRequest;

public class InternetUtils {
    public static String getClientIp(HttpServletRequest request) {
        String cfRay = request.getHeader("CF-Ray");
        if (cfRay != null && !cfRay.isEmpty()) {
            String cfIP = request.getHeader("CF-Connecting-IP");
            if (cfIP != null && !cfIP.isEmpty()) {
                return cfIP;
            }
        }
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isEmpty()) {
            String[] ips = xfHeader.split(",");
            return ips[ips.length - 1].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isEmpty()) {
            return realIp;
        }
        return request.getRemoteAddr();
    }

}
