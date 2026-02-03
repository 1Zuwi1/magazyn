package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import com.github.dawid_stolarczyk.magazyn.Model.Enums.UserTeam;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Schema(description = "Request to update user profile by admin")
public class UpdateUserProfileRequest {

    @Schema(description = "Phone number (optional)", example = "+48 555 019 203")
    @Size(max = 20, message = "Phone number too long")
    private String phone;

    @Schema(description = "Full name (optional)", example = "Jan Kowalski")
    @Size(max = 100, message = "Full name too long")
    private String fullName;

    @Schema(description = "Location/city (optional)", example = "Gdańsk, Polska")
    @Size(max = 100, message = "Location too long")
    private String location;

    @Schema(description = "Team/department (optional)", example = "OPERATIONS",
            allowableValues = {"OPERATIONS", "LOGISTICS", "WAREHOUSE", "INVENTORY", "QUALITY_CONTROL", "RECEIVING", "SHIPPING", "IT_SUPPORT", "MANAGEMENT"})
    private UserTeam team;
}
