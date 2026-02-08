package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import com.github.dawid_stolarczyk.magazyn.Model.Enums.AccountStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to update user account status")
public class UpdateUserStatusRequest {

    @NotNull(message = "STATUS_REQUIRED")
    @Schema(description = "New account status", example = "ACTIVE", allowableValues = {"ACTIVE", "DISABLED", "LOCKED", "PENDING_VERIFICATION"})
    private AccountStatus status;

    @Schema(description = "Optional reason for status change", example = "User requested account suspension")
    private String reason;
}
