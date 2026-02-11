package com.github.dawid_stolarczyk.magazyn.Utils;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class InternetUtilsTest {

    @Mock
    private HttpServletRequest request;

    @Test
    @DisplayName("should_GetClientIp_When_CloudflarePresent")
    void should_GetClientIp_When_CloudflarePresent() {
        when(request.getHeader("CF-Ray")).thenReturn("abc123");
        when(request.getHeader("CF-Connecting-IP")).thenReturn("1.2.3.4");
        when(request.getHeader("X-Forwarded-For")).thenReturn("5.6.7.8, 1.2.3.4");

        String ip = InternetUtils.getClientIp(request);

        assertThat(ip).isEqualTo("1.2.3.4");
    }

    @Test
    @DisplayName("should_GetLastIpFromXForwardedFor_When_NoCloudflare")
    void should_GetLastIpFromXForwardedFor_When_NoCloudflare() {
        when(request.getHeader("CF-Ray")).thenReturn(null);
        when(request.getHeader("X-Forwarded-For")).thenReturn("5.6.7.8, 1.2.3.4");

        String ip = InternetUtils.getClientIp(request);

        assertThat(ip).isEqualTo("1.2.3.4");
    }

    @Test
    @DisplayName("should_GetRealIp_When_OnlyXRealIpPresent")
    void should_GetRealIp_When_OnlyXRealIpPresent() {
        when(request.getHeader("CF-Ray")).thenReturn(null);
        when(request.getHeader("X-Forwarded-For")).thenReturn(null);
        when(request.getHeader("X-Real-IP")).thenReturn("9.8.7.6");

        String ip = InternetUtils.getClientIp(request);

        assertThat(ip).isEqualTo("9.8.7.6");
    }

    @Test
    @DisplayName("should_GetRemoteAddr_When_NoHeaders")
    void should_GetRemoteAddr_When_NoHeaders() {
        when(request.getHeader("CF-Ray")).thenReturn(null);
        when(request.getHeader("X-Forwarded-For")).thenReturn(null);
        when(request.getHeader("X-Real-IP")).thenReturn(null);
        when(request.getRemoteAddr()).thenReturn("10.0.0.1");

        String ip = InternetUtils.getClientIp(request);

        assertThat(ip).isEqualTo("10.0.0.1");
    }
}
