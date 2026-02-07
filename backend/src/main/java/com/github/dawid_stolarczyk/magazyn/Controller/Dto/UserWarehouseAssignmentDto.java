package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO representing a user-warehouse assignment
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "User-warehouse assignment information")
public class UserWarehouseAssignmentDto {

    @Schema(description = "User ID", example = "1")
    private Long userId;

    @Schema(description = "User full name", example = "Jan Kowalski")
    private String userFullName;

    @Schema(description = "User email", example = "jan.kowalski@example.com")
    private String userEmail;

    @Schema(description = "Warehouse ID", example = "1")
    private Long warehouseId;

    @Schema(description = "Warehouse name", example = "Magazyn Centralny")
    private String warehouseName;
}
