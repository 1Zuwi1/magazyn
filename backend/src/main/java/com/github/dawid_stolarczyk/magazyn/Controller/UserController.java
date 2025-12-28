package com.github.dawid_stolarczyk.magazyn.Controller;

import com.github.dawid_stolarczyk.magazyn.Controller.DTOs.ResponseTemplate;
import com.github.dawid_stolarczyk.magazyn.Controller.DTOs.UserInfoResponse;
import com.github.dawid_stolarczyk.magazyn.Model.Services.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users")
public class UserController {
    @Autowired
    private UserService userService;

    @Operation(summary = "Get basic information about the currently authenticated user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved user information",
                    content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = UserInfoResponse.class)
            )),
            @ApiResponse(responseCode = "400", description = "Bad request, could not retrieve user information")
    })
    @GetMapping("/me")
    public ResponseEntity<?> getBasic() {
        try {
            return ResponseEntity.ok(new ResponseTemplate<>(true, userService.getBasicInformation()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ResponseTemplate<>(false, e.getMessage()));
        }
    }
}
