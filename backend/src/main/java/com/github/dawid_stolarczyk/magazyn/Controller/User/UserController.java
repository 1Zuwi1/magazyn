package com.github.dawid_stolarczyk.magazyn.Controller.User;

import com.github.dawid_stolarczyk.magazyn.Common.ConfigurationConstants;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.*;
import com.github.dawid_stolarczyk.magazyn.Exception.AuthenticationException;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.AccountStatus;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.UserTeam;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.AuthUtil;
import com.github.dawid_stolarczyk.magazyn.Services.User.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/users")
@Tag(name = "Users", description = "Endpoints for user-related information")
@RequiredArgsConstructor
@Slf4j
public class UserController {
    private final UserService userService;

    @Operation(summary = "Get current user info")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = UserInfoResponse.class)))
    })
    @GetMapping("/me")
    public ResponseEntity<ResponseTemplate<UserInfoResponse>> getBasic(HttpServletRequest request) {
        return ResponseEntity.ok(ResponseTemplate.success(userService.getBasicInformation(request)));
    }

    @Operation(summary = "Get available teams (ADMIN only)", description = "Returns list of all available team options for dropdown/select")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - returns list of available teams with value and label",
                    content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = TeamOption.class)))),
            @ApiResponse(responseCode = "403", description = "Error codes: ACCESS_FORBIDDEN (not admin)",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @GetMapping("/teams")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<List<TeamOption>>> getAvailableTeams() {
        List<TeamOption> teams = Arrays.stream(UserTeam.values())
                .map(team -> new TeamOption(team.name(), team.getDisplayName()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ResponseTemplate.success(teams));
    }

    @Operation(summary = "Get all users with pagination and filtering (ADMIN only)",
            description = "Returns paginated list of users with optional filtering by name, email, and status")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - returns paginated list of all users",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ResponseTemplate.PagedUsersResponse.class))),
            @ApiResponse(responseCode = "403", description = "Error codes: ACCESS_FORBIDDEN (not admin)",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<PagedResponse<UserInfoResponse>>> getAllUsers(
            HttpServletRequest request,
            @Parameter(description = "Page number (0-indexed)", example = "0") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size", example = "20") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort by field", example = "id") @RequestParam(defaultValue = "id") String sortBy,
            @Parameter(description = "Sort direction (asc/desc)", example = "asc") @RequestParam(defaultValue = "asc") String sortDir,
            @Parameter(description = "Filter by full name (case-insensitive, partial match)", example = "John") @RequestParam(required = false) String name,
            @Parameter(description = "Filter by email (case-insensitive, partial match)", example = "john@") @RequestParam(required = false) String email,
            @Parameter(description = "Filter by account status", example = "ACTIVE") @RequestParam(required = false) AccountStatus status) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        PageRequest pageable = PageRequest.of(page, Math.min(size, ConfigurationConstants.MAX_PAGE_SIZE), sort);
        return ResponseEntity.ok(ResponseTemplate.success(
                PagedResponse.from(userService.adminGetAllUsersPaged(request, name, email, status, pageable))));
    }

    @Operation(summary = "Change user email (ADMIN only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - email changed, verification email sent",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: EMAIL_TAKEN",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "403", description = "Error codes: ACCESS_FORBIDDEN",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "404", description = "Error codes: RESOURCE_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PatchMapping("/{userId}/email")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<Void>> changeEmail(
            @PathVariable Long userId,
            @Valid @RequestBody ChangeEmailRequest changeRequest,
            HttpServletRequest request) {
        try {
            userService.adminChangeEmail(userId, changeRequest.getNewEmail(), request);
            return ResponseEntity.ok(ResponseTemplate.success());
        } catch (AuthenticationException e) {
            log.error("Admin email change failed for user {}", userId, e);
            HttpStatus status = AuthUtil.getHttpStatusForAuthError(e.getCode());
            return ResponseEntity.status(status).body(ResponseTemplate.error(e.getCode()));
        }
    }

    @Operation(summary = "Change current user password (requires sudo mode)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - password changed",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: INVALID_CREDENTIALS, WEAK_PASSWORD, INSUFFICIENT_PERMISSIONS",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PatchMapping("/password")
    public ResponseEntity<ResponseTemplate<Void>> changePassword(@Valid @RequestBody ChangePasswordRequest changeRequest,
                                                                 HttpServletRequest request) {
        try {
            userService.changePassword(changeRequest, request);
            return ResponseEntity.ok(ResponseTemplate.success());
        } catch (AuthenticationException e) {
            log.error("Password change failed", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ResponseTemplate.error(e.getCode()));
        }
    }

    @Operation(summary = "Update user profile (phone, location, team, full name) (ADMIN only)",
            description = "Updates user profile. Team must be one of: OPERATIONS, LOGISTICS, WAREHOUSE, INVENTORY, QUALITY_CONTROL, RECEIVING, SHIPPING, IT_SUPPORT, MANAGEMENT")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - profile updated",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: INVALID_INPUT, INVALID_PHONE_FORMAT, INVALID_FULL_NAME",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "403", description = "Error codes: ACCESS_FORBIDDEN",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "404", description = "Error codes: RESOURCE_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PatchMapping("/{userId}/profile")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<Void>> updateUserProfile(
            @PathVariable Long userId,
            @Valid @RequestBody UpdateUserProfileRequest profileRequest,
            HttpServletRequest request) {
        try {
            userService.adminUpdateUserProfile(userId, profileRequest, request);
            return ResponseEntity.ok(ResponseTemplate.success());
        } catch (AuthenticationException e) {
            log.error("Admin profile update failed for user {}", userId, e);
            HttpStatus status = AuthUtil.getHttpStatusForAuthError(e.getCode());
            return ResponseEntity.status(status).body(ResponseTemplate.error(e.getCode()));
        }
    }

    @Operation(summary = "Update user account status (ADMIN only)",
            description = """
                    Changes the account status of a user. Available statuses:
                    - ACTIVE: User can log in and use the system normally
                    - DISABLED: User cannot log in, all sessions invalidated
                    - LOCKED: User account is locked due to security reasons, all sessions invalidated
                    - PENDING_VERIFICATION: User needs to verify their email before accessing the system
                    
                    Note: Admins cannot change their own status.
                    When a user is DISABLED or LOCKED, all their active sessions are immediately invalidated.
                    """)
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - status updated",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: INVALID_INPUT, CANNOT_MODIFY_OWN_STATUS",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "403", description = "Error codes: ACCESS_FORBIDDEN",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "404", description = "Error codes: RESOURCE_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PatchMapping("/{userId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<Void>> updateUserStatus(
            @PathVariable Long userId,
            @Valid @RequestBody UpdateUserStatusRequest statusRequest,
            HttpServletRequest request) {
        try {
            userService.adminUpdateUserStatus(userId, statusRequest.getStatus(), statusRequest.getReason(), request);
            return ResponseEntity.ok(ResponseTemplate.success());
        } catch (AuthenticationException e) {
            log.error("Admin status update failed for user {}", userId, e);
            HttpStatus status = AuthUtil.getHttpStatusForAuthError(e.getCode());
            return ResponseEntity.status(status).body(ResponseTemplate.error(e.getCode()));
        }
    }

    @Operation(summary = "Delete user account (ADMIN only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - account deleted",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class))),
            @ApiResponse(responseCode = "403", description = "Error codes: ACCESS_FORBIDDEN",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "404", description = "Error codes: RESOURCE_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @DeleteMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<Void>> deleteAccount(
            @PathVariable Long userId,
            HttpServletRequest request) {
        try {
            userService.adminDeleteAccount(userId, request);
            return ResponseEntity.ok(ResponseTemplate.success());
        } catch (AuthenticationException e) {
            log.error("Admin account deletion failed for user {}", userId, e);
            HttpStatus status = AuthUtil.getHttpStatusForAuthError(e.getCode());
            return ResponseEntity.status(status).body(ResponseTemplate.error(e.getCode()));
        }
    }

    @Operation(summary = "Assign user to warehouse (ADMIN only)",
            description = "Grants user access to a warehouse. User will receive notifications for alerts from this warehouse.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - user assigned to warehouse",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class))),
            @ApiResponse(responseCode = "404", description = "Error codes: RESOURCE_NOT_FOUND, WAREHOUSE_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping("/warehouse-assignments")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<Void>> assignUserToWarehouse(
            @Valid @RequestBody UserWarehouseAssignmentRequest assignmentRequest,
            HttpServletRequest request) {
        try {
            userService.assignUserToWarehouse(
                    assignmentRequest.getUserId(),
                    assignmentRequest.getWarehouseId(),
                    request);
            return ResponseEntity.ok(ResponseTemplate.success());
        } catch (AuthenticationException e) {
            log.error("User warehouse assignment failed", e);
            HttpStatus status = AuthUtil.getHttpStatusForAuthError(e.getCode());
            return ResponseEntity.status(status).body(ResponseTemplate.error(e.getCode()));
        } catch (IllegalArgumentException e) {
            log.error("Warehouse not found for assignment", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ResponseTemplate.error(e.getMessage()));
        }
    }

    @Operation(summary = "Remove user from warehouse (ADMIN only)",
            description = "Revokes user's access to a warehouse. User will no longer receive notifications from this warehouse.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - user removed from warehouse",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class))),
            @ApiResponse(responseCode = "404", description = "Error codes: RESOURCE_NOT_FOUND, WAREHOUSE_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @DeleteMapping("/warehouse-assignments")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<Void>> removeUserFromWarehouse(
            @Valid @RequestBody UserWarehouseAssignmentRequest assignmentRequest,
            HttpServletRequest request) {
        try {
            userService.removeUserFromWarehouse(
                    assignmentRequest.getUserId(),
                    assignmentRequest.getWarehouseId(),
                    request);
            return ResponseEntity.ok(ResponseTemplate.success());
        } catch (AuthenticationException e) {
            log.error("User warehouse removal failed", e);
            HttpStatus status = AuthUtil.getHttpStatusForAuthError(e.getCode());
            return ResponseEntity.status(status).body(ResponseTemplate.error(e.getCode()));
        } catch (IllegalArgumentException e) {
            log.error("Warehouse not found for removal", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ResponseTemplate.error(e.getMessage()));
        }
    }

}
