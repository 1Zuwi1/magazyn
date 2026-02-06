package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to create a new warehouse")
public class WarehouseCreateRequest {

    @NotBlank(message = "Warehouse name is required")
    @Size(min = 3, max = 100, message = "Warehouse name must be between 3 and 100 characters")
    @Schema(description = "Name of the warehouse", example = "Central Warehouse", required = true)
    private String name;
}
