package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

import java.io.IOException;

@Getter
@Setter
@Schema(description = "Generic response template")
@JsonSerialize(using = ResponseTemplate.ResponseTemplateSerializer.class)
public class ResponseTemplate<T> {
    private boolean success;
    private String message;
    private T data;

    // Custom serializer - warunkowa serializacja
    public static class ResponseTemplateSerializer extends JsonSerializer<ResponseTemplate<?>> {
        @Override
        public void serialize(ResponseTemplate<?> value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
            gen.writeStartObject();
            gen.writeBooleanField("success", value.isSuccess());

            if (value.isSuccess()) {
                // Success: zawsze data (nawet null), nigdy message
                gen.writeObjectField("data", value.getData());
            } else {
                // Error: zawsze message (nawet null), nigdy data
                gen.writeObjectField("message", value.getMessage());
            }

            gen.writeEndObject();
        }
    }

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

    @Schema(name = "ApiSuccessItemImport")
    @Getter
    public static class ApiSuccessItemImport {
        @Schema(example = "true")
        private final boolean success = true;
        private ItemImportReport data;
    }

    @Schema(name = "ApiSuccessWarehouseImport")
    @Getter
    public static class ApiSuccessWarehouseImport {
        @Schema(example = "true")
        private final boolean success = true;
        private WarehouseImportReport data;
    }

    @Schema(name = "ApiSuccessPaged", description = "Paginated response")
    @Getter
    public static class ApiSuccessPaged<T> {
        @Schema(example = "true")
        private final boolean success = true;
        private PagedResponse<T> data;
    }

    @Schema(name = "PagedItemsResponse")
    @Getter
    public static class PagedItemsResponse {
        @Schema(example = "true")
        private final boolean success = true;
        private PagedResponse<ItemDto> data;
    }

    @Schema(name = "PagedRacksResponse")
    @Getter
    public static class PagedRacksResponse {
        @Schema(example = "true")
        private final boolean success = true;
        private PagedResponse<RackDto> data;
    }

    @Schema(name = "PagedAssortmentsResponse")
    @Getter
    public static class PagedAssortmentsResponse {
        @Schema(example = "true")
        private final boolean success = true;
        private PagedResponse<AssortmentDto> data;
    }

    @Schema(name = "PagedAssortmentsWithItemResponse")
    @Getter
    public static class PagedAssortmentsWithItemResponse {
        @Schema(example = "true")
        private final boolean success = true;
        private PagedResponse<AssortmentWithItemDto> data;
    }

    @Schema(name = "PagedUsersResponse")
    @Getter
    public static class PagedUsersResponse {
        @Schema(example = "true")
        private final boolean success = true;
        private PagedResponse<UserInfoResponse> data;
    }

    @Schema(name = "PagedInboundOperationsResponse")
    @Getter
    public static class PagedInboundOperationsResponse {
        @Schema(example = "true")
        private final boolean success = true;
        private PagedResponse<InboundOperationDto> data;
    }

    @Schema(name = "PagedOutboundOperationsResponse")
    @Getter
    public static class PagedOutboundOperationsResponse {
        @Schema(example = "true")
        private final boolean success = true;
        private PagedResponse<OutboundOperationDto> data;
    }

    @Schema(name = "PagedAlertsResponse")
    @Getter
    public static class PagedAlertsResponse {
        @Schema(example = "true")
        private final boolean success = true;
        private PagedResponse<AlertDto> data;
    }

    @Schema(name = "PagedUserNotificationsResponse")
    @Getter
    public static class PagedUserNotificationsResponse {
        @Schema(example = "true")
        private final boolean success = true;
        private PagedResponse<UserNotificationDto> data;
    }

    @Schema(name = "PagedRackReportsResponse")
    @Getter
    public static class PagedRackReportsResponse {
        @Schema(example = "true")
        private final boolean success = true;
        private PagedResponse<RackReportDto> data;
    }

    @Schema(name = "PagedBackupRecordsResponse")
    @Getter
    public static class PagedBackupRecordsResponse {
        @Schema(example = "true")
        private final boolean success = true;
        private PagedResponse<BackupRecordDto> data;
    }

    @Schema(name = "PagedBackupSchedulesResponse")
    @Getter
    public static class PagedBackupSchedulesResponse {
        @Schema(example = "true")
        private final boolean success = true;
        private PagedResponse<BackupScheduleDto> data;
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
