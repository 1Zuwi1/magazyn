package com.github.dawid_stolarczyk.magazyn.Services;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeolocationService {

    private static final String GEOLOCATION_API_URL = "http://ip-api.com/json/";

    public String getLocationFromIp(String ipAddress) {
        // Skip geolocation for localhost/private IPs
        if (isLocalOrPrivateIp(ipAddress)) {
            log.debug("Skipping geolocation for local/private IP: {}", ipAddress);
            return "Unknown";
        }

        try {
            RestTemplate restTemplate = new RestTemplate();
            String url = GEOLOCATION_API_URL + ipAddress + "?fields=status,message,country,city";

            GeolocationResponse response = restTemplate.getForObject(url, GeolocationResponse.class);

            if (response != null && "success".equals(response.getStatus())) {
                String city = response.getCity() != null ? response.getCity() : "";
                String country = response.getCountry() != null ? response.getCountry() : "";

                if (!city.isEmpty() && !country.isEmpty()) {
                    return city + ", " + country;
                } else if (!country.isEmpty()) {
                    return country;
                } else {
                    return "Unknown";
                }
            } else {
                log.warn("Geolocation API returned non-success status for IP: {}. Message: {}",
                        ipAddress, response != null ? response.getMessage() : "null response");
                return "Unknown";
            }
        } catch (Exception e) {
            log.error("Failed to fetch geolocation for IP: {}", ipAddress, e);
            return "Unknown";
        }
    }

    private boolean isLocalOrPrivateIp(String ip) {
        if (ip == null || ip.isEmpty()) {
            return true;
        }

        // Check for localhost
        if (ip.equals("127.0.0.1") || ip.equals("0:0:0:0:0:0:0:1") || ip.equals("::1")) {
            return true;
        }

        // Check for private IP ranges
        String[] parts = ip.split("\\.");
        if (parts.length == 4) {
            try {
                int firstOctet = Integer.parseInt(parts[0]);
                int secondOctet = Integer.parseInt(parts[1]);

                // 10.0.0.0 - 10.255.255.255
                if (firstOctet == 10) {
                    return true;
                }

                // 172.16.0.0 - 172.31.255.255
                if (firstOctet == 172 && secondOctet >= 16 && secondOctet <= 31) {
                    return true;
                }

                // 192.168.0.0 - 192.168.255.255
                if (firstOctet == 192 && secondOctet == 168) {
                    return true;
                }
            } catch (NumberFormatException e) {
                log.warn("Invalid IP format: {}", ip);
                return true;
            }
        }

        return false;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class GeolocationResponse {
        private String status;
        private String message;
        private String country;
        private String city;

        @JsonProperty("countryCode")
        private String countryCode;
    }
}
