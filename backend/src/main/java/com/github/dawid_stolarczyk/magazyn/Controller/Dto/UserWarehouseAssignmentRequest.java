package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request to assign or remove user from warehouse
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to assign or remove user from warehouse")
public class UserWarehouseAssignmentRequest {

    @NotNull(message = "User ID is required")
    @Schema(description = "ID of the user", example = "1")
    private Long userId;

    @NotNull(message = "Warehouse ID is required")
    @Schema(description = "ID of the warehouse", example = "1")
    private Long warehouseId;
}
