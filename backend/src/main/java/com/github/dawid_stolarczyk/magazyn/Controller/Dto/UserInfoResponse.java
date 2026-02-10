package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "User information response")
public class UserInfoResponse {
    @Schema(description = "User ID", example = "1")
    private int id;

    @Schema(description = "Full name", example = "Jan Kowalski")
    private String full_name;

    @Schema(description = "Email address", example = "jan@example.com")
    private String email;

    @Schema(description = "User role", example = "ADMIN")
    private String role;

    @Schema(description = "Account status", example = "ACTIVE")
    private String account_status;

    @Schema(description = "Phone number", example = "+48 555 019 203")
    private String phone;

    @Schema(description = "Location/city", example = "Gdańsk, Polska")
    private String location;

    @Schema(description = "Team/department name", example = "Operacje magazynowe")
    private String team;

    @Schema(description = "Last login timestamp", example = "2026-02-05T14:30:00Z")
    private String last_login;

    @Schema(description = "List of assigned warehouse IDs", example = "[1, 2, 5]")
    private List<Long> warehouse_ids;

    @Schema(description = "Whether backup codes need to be regenerated (true if any backup code has been used)", example = "false")
    private Boolean backup_codes_refresh_needed;

}
