package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import com.github.dawid_stolarczyk.magazyn.Model.Enums.ApiKeyScope;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "API key details (without the secret key)")
public class ApiKeyResponse {

    @Schema(description = "API key ID")
    private Long id;

    @Schema(description = "First 8 characters of the key for identification", example = "a1b2c3d4")
    private String keyPrefix;

    @Schema(description = "Human-readable name", example = "Sensor Hala A")
    private String name;

    @Schema(description = "Bound warehouse ID (null = global)")
    private Long warehouseId;

    @Schema(description = "Bound warehouse name")
    private String warehouseName;

    @Schema(description = "Whether the key is active")
    private boolean isActive;

    @Schema(description = "Granted scopes/permissions")
    private Set<ApiKeyScope> scopes;

    @Schema(description = "When the key was created")
    private Instant createdAt;

    @Schema(description = "When the key was last used")
    private Instant lastUsedAt;

    @Schema(description = "User ID who created this key")
    private Long createdByUserId;
}
