package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to reset password with token")
public class ResetPasswordRequest {

    @NotBlank(message = "Reset token is required")
    @Schema(description = "Password reset token from email", example = "a1b2c3d4-e5f6-7890-abcd-ef1234567890", required = true)
    private String token;

    @NotBlank(message = "New password is required")
    @Size(min = 8, max = 100, message = "Password must be at least 8 characters long")
    @Pattern(
            // Wyjaśnienie:
            // (?=.*[A-Z]) - co najmniej jedna duża litera
            // (?=.*[a-z]) - co najmniej jedna mała litera
            // (?=.*\d)    - co najmniej jedna cyfra
            // (?=.*[\W_]) - co najmniej jeden znak specjalny (nie-litera/cyfra)
            regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[\\W_]).{8,}$",
            message = "PASSWORD_TOO_WEAK"
    )
    @Schema(description = "New password (minimum 8 characters)", example = "NewSecurePassword123!", required = true)
    private String newPassword;
}
