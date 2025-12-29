package com.github.dawid_stolarczyk.magazyn.Controller;

import com.github.dawid_stolarczyk.magazyn.Controller.DTOs.CodeRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.DTOs.ResponseTemplate;
import com.github.dawid_stolarczyk.magazyn.Model.Services.TwoFactorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    @Operation(summary = "Send a two-factor authentication code via email to the current user.")
    @PostMapping("/email/send")
    public ResponseEntity<?> sendEmailCode(HttpServletResponse response) {
        try {
            twoFactorService.sendTwoFactorCodeViaEmail();
            return ResponseEntity.ok(new ResponseTemplate<>(true, "2FA code sent via email"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ResponseTemplate<>(false, e.getMessage()));
        }
    }

    @Operation(summary = "Check the provided email code for two-factor authentication.")
    @PostMapping("/email/check")
    public ResponseEntity<?> checkEmailCode(@RequestBody CodeRequest codeRequest, HttpServletResponse response) {
        try {
            twoFactorService.checkTwoFactorEmailCode(codeRequest.getCode(), response);
            return ResponseEntity.ok(new ResponseTemplate<>(true, "2FA email code verified"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ResponseTemplate<>(false, e.getMessage()));
        }
    }

    @Operation(summary = "Generate a new Google Authenticator secret for the current user.")
    @PostMapping("/authenticator/start")
    public ResponseEntity<?> generateAuthenticatorSecret() {
        try {
            return ResponseEntity.ok(new ResponseTemplate<>(true, twoFactorService.generateTwoFactorGoogleSecret()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ResponseTemplate<>(false, e.getMessage()));
        }
    }

    @Operation(summary = "Check the provided Google Authenticator code for two-factor authentication.")
    @PostMapping("/authenticator/check")
    public ResponseEntity<?> checkAuthenticatorCode(@RequestBody CodeRequest codeRequest, HttpServletResponse response) {
        try {
            twoFactorService.checkTwoFactorGoogleCode(Integer.parseInt(codeRequest.getCode()), response);
            return ResponseEntity.ok(new ResponseTemplate<>(true, "2FA Google Authenticator code verified"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ResponseTemplate<>(false, e.getMessage()));
        }
    }

    
}
