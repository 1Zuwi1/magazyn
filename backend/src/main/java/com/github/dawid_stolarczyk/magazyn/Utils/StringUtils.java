package com.github.dawid_stolarczyk.magazyn.Utils;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;

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
}
