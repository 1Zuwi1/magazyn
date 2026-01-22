package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
@Getter
@Setter
public class ResponseTemplate<T> {
    private boolean success;
    private String message;
    private T data;

    private ResponseTemplate(boolean success, T data, String message) {
        this.success = success;
        this.data = data;
        this.message = message;
    }

    public static <T> ResponseTemplate<T> success(T data) {
        return new ResponseTemplate<>(true, data, null);
    }

    public static <T> ResponseTemplate<T> error(String message) {
        return new ResponseTemplate<>(false, null, message);
    }
}
