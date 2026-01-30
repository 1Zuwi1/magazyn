package com.github.dawid_stolarczyk.magazyn.Controller;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ChangeEmailRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ChangeFullNameRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ChangePasswordRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ResponseTemplate;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.UserInfoResponse;
import com.github.dawid_stolarczyk.magazyn.Exception.AuthenticationException;
import com.github.dawid_stolarczyk.magazyn.Services.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@Tag(name = "Users", description = "Endpoints for user-related information")
@RequiredArgsConstructor
@Slf4j
public class UserController {
    private final UserService userService;
    private final HttpServletRequest request;


    @Operation(summary = "Get basic information about the currently authenticated user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved user information",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessData.class))),
            @ApiResponse(responseCode = "400", description = "Bad request, could not retrieve user information",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @GetMapping("/me")
    public ResponseEntity<ResponseTemplate<UserInfoResponse>> getBasic(HttpServletRequest request) {
        return ResponseEntity.ok(ResponseTemplate.success(userService.getBasicInformation(request)));
    }

    @Operation(summary = "Change the current user's email address.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Email change initiated",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class))),
            @ApiResponse(responseCode = "400", description = "Email already in use",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PatchMapping("/email")
    public ResponseEntity<ResponseTemplate<Void>> changeEmail(@Valid @RequestBody ChangeEmailRequest changeRequest) {
        try {
            userService.changeEmail(changeRequest, request);
            return ResponseEntity.ok(ResponseTemplate.success());
        } catch (AuthenticationException e) {
            log.error("Email change failed");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ResponseTemplate.error(e.getCode()));
        }
    }
    @Operation(summary = "Change the current user's password.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Password changed successfully",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class))),
            @ApiResponse(responseCode = "400", description = "Invalid current password or weak new password",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PatchMapping("/password")
    public ResponseEntity<ResponseTemplate<Void>> changePassword(@Valid @RequestBody ChangePasswordRequest changeRequest) {
        try {
            userService.changePassword(changeRequest, request);
            return ResponseEntity.ok(ResponseTemplate.success());
        } catch (AuthenticationException e) {
            log.error("Password change failed");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ResponseTemplate.error(e.getCode()));
        }
    }
    @Operation(summary = "Change the current user's full name.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Full name changed successfully",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PatchMapping("/full-name")
    public ResponseEntity<ResponseTemplate<Void>> changeFullName(@Valid @RequestBody ChangeFullNameRequest changeRequest) {
        try {
            userService.changeFullName(changeRequest, request);
            return ResponseEntity.ok(ResponseTemplate.success());
        } catch (AuthenticationException e) {
            log.error("Full name change failed", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ResponseTemplate.error(e.getCode()));
        }
    }

    @Operation(summary = "Delete the current user's account.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Account deleted successfully",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @DeleteMapping("/me")
    public ResponseEntity<ResponseTemplate<Void>> deleteAccount(HttpServletResponse response) {
        try {
            userService.deleteAccount(request, response);
            return ResponseEntity.ok(ResponseTemplate.success());
        } catch (AuthenticationException e) {
            log.error("Account deletion failed");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ResponseTemplate.error(e.getCode()));
        }
    }
}
