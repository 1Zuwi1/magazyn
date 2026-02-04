package com.github.dawid_stolarczyk.magazyn.Controller.Dto.Auth;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Passkey information")
public class PasskeyDto {

    @Schema(description = "Passkey ID", example = "1")
    private Long id;

    @Schema(description = "User-defined passkey name", example = "My MacBook")
    private String name;
}
