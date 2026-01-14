package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;


@JsonInclude(JsonInclude.Include.NON_NULL)
@Getter
@Setter
public class LoginRequest {
    @NotBlank
    private String email;
    @NotBlank
    private String password;
    @NotNull
    private boolean rememberMe;

}
