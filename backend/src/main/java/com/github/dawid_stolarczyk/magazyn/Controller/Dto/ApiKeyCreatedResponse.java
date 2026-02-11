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
@Schema(description = "Response after creating a new API key. The raw key is shown only once.")
public class ApiKeyCreatedResponse {

    @Schema(description = "API key ID")
    private Long id;

    @Schema(description = "The full API key — shown only once, store it securely",
            example = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2")
    private String rawKey;

    @Schema(description = "First 8 characters for future identification", example = "a1b2c3d4")
    private String keyPrefix;

    @Schema(description = "Human-readable name", example = "Sensor Hala A")
    private String name;

    @Schema(description = "Bound warehouse ID (null = global)")
    private Long warehouseId;

    @Schema(description = "Bound warehouse name")
    private String warehouseName;

    @Schema(description = "Granted scopes/permissions")
    private Set<ApiKeyScope> scopes;

    @Schema(description = "When the key was created")
    private Instant createdAt;
}
