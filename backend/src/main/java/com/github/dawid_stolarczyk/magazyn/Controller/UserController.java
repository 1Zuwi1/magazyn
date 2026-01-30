package com.github.dawid_stolarczyk.magazyn.Controller;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ResponseTemplate;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.UserInfoResponse;
import com.github.dawid_stolarczyk.magazyn.Services.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users")
@Tag(name = "Users", description = "Endpoints for user-related information")
public class UserController {
    @Autowired
    private UserService userService;

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
}
