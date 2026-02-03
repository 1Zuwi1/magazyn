package com.github.dawid_stolarczyk.magazyn.Controller.User;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.*;
import com.github.dawid_stolarczyk.magazyn.Exception.AuthenticationException;
import com.github.dawid_stolarczyk.magazyn.Services.User.UserService;
import io.swagger.v3.oas.annotations.Operation;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@Tag(name = "Users", description = "Endpoints for user-related information")
@RequiredArgsConstructor
@Slf4j
public class UserController {
    private final UserService userService;

    @Operation(summary = "Get current user info")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - returns user info (id, email, fullName, role, status, default2faMethod)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = UserInfoResponse.class)))
    })
    @GetMapping("/me")
    public ResponseEntity<ResponseTemplate<UserInfoResponse>> getBasic(HttpServletRequest request) {
        return ResponseEntity.ok(ResponseTemplate.success(userService.getBasicInformation(request)));
    }

    @Operation(summary = "[ADMIN] Get all users")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - returns list of all users",
                    content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = UserInfoResponse.class)))),
            @ApiResponse(responseCode = "403", description = "Error codes: ACCESS_FORBIDDEN (not admin)",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<List<UserInfoResponse>>> getAllUsers(HttpServletRequest request) {
        return ResponseEntity.ok(ResponseTemplate.success(userService.adminGetAllUsers(request)));
    }

    @Operation(summary = "[ADMIN] Change user email")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - email changed, verification email sent",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: EMAIL_TAKEN, USER_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "403", description = "Error codes: ACCESS_FORBIDDEN",
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
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ResponseTemplate.error(e.getCode()));
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

    @Operation(summary = "[ADMIN] Change user full name")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - full name changed",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: USER_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "403", description = "Error codes: ACCESS_FORBIDDEN",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PatchMapping("/{userId}/full-name")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<Void>> changeFullName(
            @PathVariable Long userId,
            @Valid @RequestBody ChangeFullNameRequest changeRequest,
            HttpServletRequest request) {
        try {
            userService.adminChangeFullName(userId, changeRequest.getNewFullName(), request);
            return ResponseEntity.ok(ResponseTemplate.success());
        } catch (AuthenticationException e) {
            log.error("Admin full name change failed for user {}", userId, e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ResponseTemplate.error(e.getCode()));
        }
    }

    @Operation(summary = "[ADMIN] Delete user account")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - account deleted",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: USER_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "403", description = "Error codes: ACCESS_FORBIDDEN",
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
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ResponseTemplate.error(e.getCode()));
        }
    }
}
