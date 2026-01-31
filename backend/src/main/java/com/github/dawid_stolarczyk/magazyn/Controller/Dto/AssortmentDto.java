package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssortmentDto {
    @Schema(description = "Unique identifier of the assortment", example = "1")
    private Long id;

    @NotNull
    @Schema(description = "ID of the item", example = "1")
    private Long itemId;

    @NotNull
    @Schema(description = "ID of the rack", example = "1")
    private Long rackId;

    @Schema(description = "ID of the user who created this placement", example = "1")
    private Long userId;

    @Schema(description = "Creation timestamp")
    private Timestamp createdAt;

    @Schema(description = "Expiration timestamp")
    private Timestamp expiresAt;

    @Schema(description = "X position in the rack", example = "1")
    private Integer positionX;

    @Schema(description = "Y position in the rack", example = "1")
    private Integer positionY;
}
