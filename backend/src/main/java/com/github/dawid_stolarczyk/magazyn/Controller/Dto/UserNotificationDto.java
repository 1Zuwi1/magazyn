package com.github.dawid_stolarczyk.magazyn.Controller.Dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO for user notification (alert with read status)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "User notification with read status")
public class UserNotificationDto {

    @Schema(description = "Notification ID", example = "1")
    private Long id;

    @Schema(description = "The alert details")
    private AlertDto alert;

    @Schema(description = "Whether the user has read this notification", example = "false")
    private boolean isRead;

    @Schema(description = "When the notification was created/sent to user")
    private Instant createdAt;

    @Schema(description = "When the user read this notification (if read)")
    private Instant readAt;
}
