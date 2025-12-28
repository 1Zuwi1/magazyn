package com.github.dawid_stolarczyk.magazyn.Controller;

import com.github.dawid_stolarczyk.magazyn.Controller.DTOs.ResponseTemplate;
import com.github.dawid_stolarczyk.magazyn.Model.Services.TwoFactorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
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
@RequestMapping("/2fa")
public class TwoFactorController {
    @Autowired
    private TwoFactorService twoFactorService;

    @Operation(summary = "Retrieve the current user's two-factor authentication methods.")
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Successfully retrieved two-factor methods",
                    content = @Content(
                            mediaType = "application/json",
                            array = @ArraySchema(schema = @Schema(implementation = String.class))
                    )),
            @ApiResponse(responseCode = "400", description = "Bad request, could not retrieve two-factor methods")
    })
    @GetMapping
    public ResponseEntity<?> twoFactorMethods() {
        try {
            return ResponseEntity.ok(new ResponseTemplate<>(true, twoFactorService.usersTwoFactorMethod()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ResponseTemplate<>(false, e.getMessage()));
        }
    }
}
