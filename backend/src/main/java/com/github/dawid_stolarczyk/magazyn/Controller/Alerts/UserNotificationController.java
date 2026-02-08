package com.github.dawid_stolarczyk.magazyn.Controller.Alerts;

import com.github.dawid_stolarczyk.magazyn.Common.ConfigurationConstants;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.PagedResponse;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ResponseTemplate;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.UserNotificationDto;
import com.github.dawid_stolarczyk.magazyn.Services.Alerts.UserNotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for managing user-specific notifications.
 * Each user has their own read/unread status for alerts.
 */
@RestController
@RequestMapping("/notifications")
@Tag(name = "User Notifications", description = "Endpoints for managing user-specific alert notifications")
@RequiredArgsConstructor
public class UserNotificationController {

    private final UserNotificationService notificationService;

    @Operation(summary = "Get all notifications for the current user",
            description = "Returns all notifications assigned to the logged-in user with pagination")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseTemplate.PagedUserNotificationsResponse.class)))
    })
    @GetMapping
    public ResponseEntity<ResponseTemplate<PagedResponse<UserNotificationDto>>> getMyNotifications(
            HttpServletRequest request,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, Math.min(size, ConfigurationConstants.MAX_PAGE_SIZE));
        return ResponseEntity.ok(ResponseTemplate.success(
                PagedResponse.from(notificationService.getMyNotifications(request, pageable))));
    }

    @Operation(summary = "Get unread notifications for the current user",
            description = "Returns only unread notifications for the logged-in user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseTemplate.PagedUserNotificationsResponse.class)))
    })
    @GetMapping("/unread")
    public ResponseEntity<ResponseTemplate<PagedResponse<UserNotificationDto>>> getMyUnreadNotifications(
            HttpServletRequest request,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, Math.min(size, ConfigurationConstants.MAX_PAGE_SIZE));
        return ResponseEntity.ok(ResponseTemplate.success(
                PagedResponse.from(notificationService.getMyUnreadNotifications(request, pageable))));
    }

    @Operation(summary = "Get count of unread notifications",
            description = "Returns the number of unread notifications for the current user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - returns unread count",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Long.class, example = "5")))
    })
    @GetMapping("/unread/count")
    public ResponseEntity<ResponseTemplate<Long>> getUnreadCount(HttpServletRequest request) {
        return ResponseEntity.ok(ResponseTemplate.success(notificationService.getUnreadCount(request)));
    }

    @Operation(summary = "Get notification for a specific alert",
            description = "Returns the notification for a specific alert for the current user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = UserNotificationDto.class))),
            @ApiResponse(responseCode = "404", description = "Error codes: NOTIFICATION_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @GetMapping("/alert/{alertId}")
    public ResponseEntity<ResponseTemplate<UserNotificationDto>> getNotificationByAlert(
            @PathVariable Long alertId,
            HttpServletRequest request) {
        try {
            return ResponseEntity.ok(ResponseTemplate.success(
                    notificationService.getNotificationByAlert(alertId, request)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ResponseTemplate.error(e.getMessage()));
        }
    }

    @Operation(summary = "Mark notification as read",
            description = "Marks a specific notification as read for the current user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Notification marked as read",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = UserNotificationDto.class))),
            @ApiResponse(responseCode = "404", description = "Error codes: NOTIFICATION_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "403", description = "Error codes: INSUFFICIENT_PERMISSIONS",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<ResponseTemplate<UserNotificationDto>> markAsRead(
            @PathVariable Long notificationId,
            HttpServletRequest request) {
        try {
            return ResponseEntity.ok(ResponseTemplate.success(
                    notificationService.markAsRead(notificationId, request)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ResponseTemplate.error(e.getMessage()));
        }
    }

    @Operation(summary = "Mark notification as unread",
            description = "Marks a specific notification as unread for the current user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Notification marked as unread",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = UserNotificationDto.class))),
            @ApiResponse(responseCode = "404", description = "Error codes: NOTIFICATION_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "403", description = "Error codes: INSUFFICIENT_PERMISSIONS",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PatchMapping("/{notificationId}/unread")
    public ResponseEntity<ResponseTemplate<UserNotificationDto>> markAsUnread(
            @PathVariable Long notificationId,
            HttpServletRequest request) {
        try {
            return ResponseEntity.ok(ResponseTemplate.success(
                    notificationService.markAsUnread(notificationId, request)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ResponseTemplate.error(e.getMessage()));
        }
    }

    @Operation(summary = "Mark all notifications as read",
            description = "Marks all unread notifications as read for the current user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - returns number of notifications marked as read",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Integer.class, example = "10")))
    })
    @PatchMapping("/read-all")
    public ResponseEntity<ResponseTemplate<Integer>> markAllAsRead(HttpServletRequest request) {
        return ResponseEntity.ok(ResponseTemplate.success(notificationService.markAllAsRead(request)));
    }
}
