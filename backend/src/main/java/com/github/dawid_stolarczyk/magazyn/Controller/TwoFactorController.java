package com.github.dawid_stolarczyk.magazyn.Controller;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.CodeRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ResponseTemplate;
import com.github.dawid_stolarczyk.magazyn.Exception.AuthenticationException;
import com.github.dawid_stolarczyk.magazyn.Services.TwoFactorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/2fa")
public class TwoFactorController {
    @Autowired
    private TwoFactorService twoFactorService;
    @Autowired
    private HttpServletRequest request;
    @Autowired
    private HttpServletResponse response;

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
        return ResponseEntity.ok(new ResponseTemplate<>(true, twoFactorService.getUsersTwoFactorMethods(request)));
    }

    @Operation(summary = "Send a two-factor authentication code via email to the current user.")
    @PostMapping("/email/send")
    public ResponseEntity<?> sendEmailCode() {
        twoFactorService.sendTwoFactorCodeViaEmail(request);
        return ResponseEntity.ok(new ResponseTemplate<>(true, "2FA code sent via email"));
    }

    @Operation(summary = "Generate a new Google Authenticator secret for the current user.")
    @PostMapping("/authenticator/start")
    public ResponseEntity<?> generateAuthenticatorSecret() {
        return ResponseEntity.ok(new ResponseTemplate<>(true, twoFactorService.generateTwoFactorGoogleSecret(request)));
    }

    @PostMapping("/backup-codes/generate")
    @Operation(summary = "Generate new backup codes for the current user.")
    public ResponseEntity<?> generateBackupCodes() {
        return ResponseEntity.ok(new ResponseTemplate<>(true, twoFactorService.generateBackupCodes(request)));
    }

    @Operation(summary = "Check the provided two-factor authentication code for the current user.")
    @PostMapping("/check")
    public ResponseEntity<?> checkCode(@Valid @RequestBody CodeRequest codeRequest) {
        try {
            twoFactorService.checkCode(codeRequest, request, response);
            return ResponseEntity.ok(new ResponseTemplate<>(true, "2FA code verified"));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ResponseTemplate<>(false, e.getCode(), e.getMessage()));
        }
    }
}
