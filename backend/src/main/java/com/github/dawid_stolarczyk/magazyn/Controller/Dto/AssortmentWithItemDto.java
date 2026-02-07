package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Assortment with full item details")
public class AssortmentWithItemDto {

    @Schema(description = "Unique identifier of the assortment", example = "1")
    private Long id;

    @Schema(
            description = "GS1-128 barcode code (digits only) using AIs (11) YYMMDD, (01) GTIN-14, (21) serial",
            example = "11020126010000000000123421012345"
    )
    private String code;

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

    @Schema(description = "Full item details")
    private ItemDto item;
}
