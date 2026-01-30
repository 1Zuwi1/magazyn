package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChangeFullNameRequest {
    @NotBlank
    @Size(min = 3, max = 100)
    @Schema(description = "New full name of the user", example = "Jan Kowalski")
    private String newFullName;
}
