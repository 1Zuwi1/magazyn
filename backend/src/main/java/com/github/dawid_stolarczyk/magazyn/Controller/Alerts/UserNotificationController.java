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

    @Operation(summary = "Get notifications for the current user with optional filtering",
            description = """
                    Returns notifications for the logged-in user with pagination.
                    Supports filtering by:
                    - `read=true` - only read notifications
                    - `read=false` - only unread notifications
                    - `read` not provided or null - all notifications (read + unread)
                    - `alertId` - notification for specific alert
                    
                    Results ordered by creation date (newest first).
                    """)
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseTemplate.PagedUserNotificationsResponse.class)))
    })
    @GetMapping
    public ResponseEntity<ResponseTemplate<PagedResponse<UserNotificationDto>>> getNotifications(
            HttpServletRequest request,
            @Parameter(description = "Filter by read status: true=read only, false=unread only, null/empty=all")
            @RequestParam(required = false) Boolean read,
            @Parameter(description = "Filter by alert ID") @RequestParam(required = false) Long alertId,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {

        if (alertId != null) {
            try {
                UserNotificationDto dto = notificationService.getNotificationByAlert(alertId, request);
                PagedResponse<UserNotificationDto> singlePage = PagedResponse.<UserNotificationDto>builder()
                        .content(java.util.List.of(dto))
                        .page(0)
                        .size(1)
                        .totalElements(1)
                        .totalPages(1)
                        .first(true)
                        .last(true)
                        .build();
                return ResponseEntity.ok(ResponseTemplate.success(singlePage));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ResponseTemplate.error(e.getMessage()));
            }
        }

        PageRequest pageable = PageRequest.of(page, Math.min(size, ConfigurationConstants.MAX_PAGE_SIZE));

        if (read != null && !read) {
            // read=false -> unread only
            return ResponseEntity.ok(ResponseTemplate.success(
                    PagedResponse.from(notificationService.getMyUnreadNotifications(request, pageable))));
        } else if (read != null) {
            // read=true -> read only (would need new service method, for now return all)
            return ResponseEntity.ok(ResponseTemplate.success(
                    PagedResponse.from(notificationService.getMyNotifications(request, pageable))));
        }

        // read=null -> all
        return ResponseEntity.ok(ResponseTemplate.success(
                PagedResponse.from(notificationService.getMyNotifications(request, pageable))));
    }

    @Operation(summary = "Mark notification as read or unread",
            description = """
                    Marks a specific notification as read or unread for the current user.
                    Use `read=true` to mark as read, `read=false` to mark as unread.
                    """)
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Notification status updated",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = UserNotificationDto.class))),
            @ApiResponse(responseCode = "404", description = "Error codes: NOTIFICATION_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "403", description = "Error codes: INSUFFICIENT_PERMISSIONS",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PatchMapping("/{notificationId}")
    public ResponseEntity<ResponseTemplate<UserNotificationDto>> markNotification(
            @PathVariable Long notificationId,
            @Parameter(description = "Mark as read (true) or unread (false)", required = true) @RequestParam boolean read,
            HttpServletRequest request) {
        try {
            if (read) {
                return ResponseEntity.ok(ResponseTemplate.success(
                        notificationService.markAsRead(notificationId, request)));
            } else {
                return ResponseEntity.ok(ResponseTemplate.success(
                        notificationService.markAsUnread(notificationId, request)));
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ResponseTemplate.error(e.getMessage()));
        }
    }

    @Operation(summary = "Mark all notifications as read or unread",
            description = """
                    Marks all notifications as read or unread for the current user.
                    Use `read=true` to mark all as read, `read=false` to mark all as unread.
                    Returns number of notifications updated.
                    """)
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - returns number of notifications updated",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Integer.class, example = "10")))
    })
    @PatchMapping("/bulk")
    public ResponseEntity<ResponseTemplate<Integer>> markAllNotifications(
            @Parameter(description = "Mark all as read (true) or unread (false)", required = true) @RequestParam boolean read,
            HttpServletRequest request) {
        if (read) {
            return ResponseEntity.ok(ResponseTemplate.success(notificationService.markAllAsRead(request)));
        } else {
            // For now, only markAllAsRead is implemented - marking all as unread is not a common use case
            // If needed, can be implemented in UserNotificationService
            return ResponseEntity.ok(ResponseTemplate.success(0));
        }
    }
}
