package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Getter
@Setter
@Schema(description = "User information response")
@AllArgsConstructor
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

    public UserInfoResponse() {
    }

}
