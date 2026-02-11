package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Item image details")
public class ItemImageDto {

    @Schema(description = "Image ID", example = "1")
    private Long id;

    @Schema(description = "Item ID this image belongs to", example = "42")
    private Long itemId;

    @Schema(description = "Photo URL/path in storage")
    private String photoUrl;

    @Schema(description = "Whether this is the primary image for the item", example = "true")
    private boolean isPrimary;

    @Schema(description = "Display order of this image", example = "0")
    private int displayOrder;

    @Schema(description = "Whether an embedding has been generated for this image", example = "true")
    private boolean hasEmbedding;

    @Schema(description = "When this image was uploaded")
    private Instant createdAt;
}
