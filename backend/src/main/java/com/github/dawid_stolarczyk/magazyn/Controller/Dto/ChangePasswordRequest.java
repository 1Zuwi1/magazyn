package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChangePasswordRequest {
    @NotBlank
    @Schema(description = "Current password", example = "CurrentPassword123!")
    private String oldPassword;

    @NotBlank
    @Size(min = 8, max = 128)
    @Schema(description = "New password", example = "NewPassword123!")
    private String newPassword;
}
