package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import com.github.dawid_stolarczyk.magazyn.Model.Enums.Default2faMethod;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SendTwoFactorCodeRequest {
    @NotNull
    @Schema(description = "2FA method to send a code for", example = "EMAIL",
            allowableValues = {"EMAIL", "AUTHENTICATOR", "BACKUP_CODES", "PASSKEY"})
    private Default2faMethod method;
}
