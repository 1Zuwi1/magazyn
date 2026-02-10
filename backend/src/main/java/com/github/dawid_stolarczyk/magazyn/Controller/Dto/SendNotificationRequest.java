package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Schema(description = "Request for admin to send notifications to users")
public class SendNotificationRequest {

    @Schema(description = "Notification message", example = "System maintenance scheduled for tomorrow at 2 AM")
    @NotBlank(message = "Message cannot be blank")
    @Size(max = 500, message = "Message too long")
    private String message;

    @Schema(description = "Optional: List of specific user IDs to send notification to. If null or empty, sends to all active users", example = "[1, 2, 3]")
    private List<Long> userIds;
}
