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
public class WarehouseDto {
    @Schema(description = "Unique identifier of the warehouse", example = "1")
    private Long id;

    @NotBlank
    @Size(min = 3, max = 100)
    @Schema(description = "Name of the warehouse", example = "Central Warehouse")
    private String name;
}
