package com.github.dawid_stolarczyk.magazyn.Controller.Dto.Auth;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to rename a passkey")
public class PasskeyRenameRequest {

    @NotBlank(message = "Passkey name cannot be blank")
    @Size(min = 1, max = 100, message = "Passkey name must be between 1 and 100 characters")
    @Schema(description = "New name for the passkey", example = "My MacBook Pro")
    private String name;
}
