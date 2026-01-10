package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Getter
@Setter
public class ResponseTemplate<T> {
    private boolean success;
    private String code;
    private T data;

    public ResponseTemplate(boolean success, T data) {
        this.success = success;
        this.data = data;
    }
    public ResponseTemplate(boolean success, String code, T data) {
        this.success = success;
        this.code = code;
        this.data = data;
    }
}
