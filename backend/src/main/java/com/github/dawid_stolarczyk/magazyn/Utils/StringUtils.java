package com.github.dawid_stolarczyk.magazyn.Utils;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class StringUtils {
    @Value("${auth.password.min-length}")
    private int MIN_PASSWORD_LENGTH;

    public static int MIN_PASSWORD_LENGTH_STATIC;

    @PostConstruct
    public void init() {
        MIN_PASSWORD_LENGTH_STATIC = MIN_PASSWORD_LENGTH;
    }

    public static boolean checkPasswordStrength(String password) {
        if (password == null)
            return false;

        password = password.trim();

        if (password.length() < MIN_PASSWORD_LENGTH_STATIC)
            return false;

        boolean hasUpper = false;
        boolean hasLower = false;
        boolean hasDigit = false;
        boolean hasSpecial = false;

        for (char c : password.toCharArray()) {
            if (Character.isUpperCase(c)) {
                hasUpper = true;
            } else if (Character.isLowerCase(c)) {
                hasLower = true;
            } else if (Character.isDigit(c)) {
                hasDigit = true;
            } else if (!Character.isLetterOrDigit(c)) {
                hasSpecial = true;
            }
        }

        return hasUpper && hasLower && hasDigit && hasSpecial;
    }

    /**
     * Normalizes a rack marker to ensure consistent formatting:
     * - Trims whitespace
     * - Converts to uppercase
     * - Replaces multiple spaces/dashes/underscores with single ones
     * - Removes any characters except alphanumeric, dashes, and underscores
     *
     * @param marker the raw marker string
     * @return normalized marker
     * @throws IllegalArgumentException if marker is null or becomes empty after normalization
     */
    public static String normalizeRackMarker(String marker) {
        if (marker == null || marker.isBlank()) {
            throw new IllegalArgumentException("MARKER_REQUIRED");
        }

        // Trim and convert to uppercase
        String normalized = marker.trim().toUpperCase();

        // Explicitly replace Polish characters with their base equivalents
        // Uppercase Polish characters
        normalized = normalized.replace("Ą", "A")
                .replace("Ć", "C")
                .replace("Ę", "E")
                .replace("Ł", "L")
                .replace("Ń", "N")
                .replace("Ó", "O")
                .replace("Ś", "S")
                .replace("Ź", "Z")
                .replace("Ż", "Z");

        // Remove any characters except alphanumeric, dashes, underscores, and spaces
        normalized = normalized.replaceAll("[^A-Z0-9_\\-\\s]", "");

        // Replace multiple spaces/dashes/underscores with single ones
        normalized = normalized.replaceAll("\\s+", "-");
        normalized = normalized.replaceAll("-+", "-");
        normalized = normalized.replaceAll("_+", "_");

        // Remove leading/trailing dashes or underscores
        normalized = normalized.replaceAll("^[-_]+|[-_]+$", "");

        if (normalized.isEmpty()) {
            throw new IllegalArgumentException("MARKER_INVALID_FORMAT");
        }

        return normalized;
    }
}
