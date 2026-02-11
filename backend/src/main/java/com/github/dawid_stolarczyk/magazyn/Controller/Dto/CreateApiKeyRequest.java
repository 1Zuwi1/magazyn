package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import com.github.dawid_stolarczyk.magazyn.Model.Enums.ApiKeyScope;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to create a new API key")
public class CreateApiKeyRequest {

    @NotBlank(message = "API key name is required")
    @Size(min = 3, max = 100, message = "Name must be between 3 and 100 characters")
    @Schema(description = "Human-readable name for the API key", example = "Sensor Hala A")
    private String name;

    @Schema(description = "Warehouse ID to bind this key to (null = global access)", example = "1")
    private Long warehouseId;

    @NotEmpty(message = "At least one scope is required")
    @Schema(description = "Permissions granted to this API key")
    private Set<ApiKeyScope> scopes;
}
