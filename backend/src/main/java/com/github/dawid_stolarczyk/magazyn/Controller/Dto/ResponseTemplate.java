package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Schema(description = "Generic response template")
public class ResponseTemplate<T> {
    private boolean success;
    private String message;
    private T data;

    // Schematy dla dokumentacji OpenAPI
    @Schema(name = "ApiSuccess")
    @Getter
    public static class ApiSuccess {
        @Schema(example = "true")
        private final boolean success = true;
    }

    @Schema(name = "ApiSuccessData")
    @Getter
    public static class ApiSuccessData<T> {
        @Schema(example = "true")
        private final boolean success = true;
        private T data;
    }

    @Schema(name = "ApiSuccessRackImport")
    @Getter
    public static class ApiSuccessRackImport {
        @Schema(example = "true")
        private final boolean success = true;
        private RackImportReport data;
    }

    @Schema(name = "ApiSuccessAssortmentImport")
    @Getter
    public static class ApiSuccessAssortmentImport {
        @Schema(example = "true")
        private final boolean success = true;
        private AssortmentImportReport data;
    }

    @Schema(name = "ApiError")
    @Getter
    public static class ApiError {
        @Schema(example = "false")
        private final boolean success = false;
        @Schema(example = "ERROR_CODE")
        private String message;
    }

    private ResponseTemplate(boolean success, T data, String message) {
        this.success = success;
        this.data = data;
        this.message = message;
    }

    public static <T> ResponseTemplate<T> success(T data) {
        return new ResponseTemplate<>(true, data, null);
    }

    public static ResponseTemplate<Void> success() {
        return new ResponseTemplate<>(true, null, null);
    }

    public static <T> ResponseTemplate<T> error(String message) {
        return new ResponseTemplate<>(false, null, message != null ? message : "UNKNOWN_ERROR");
    }
}
