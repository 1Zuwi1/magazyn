package com.github.dawid_stolarczyk.magazyn.Controller;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ApiKeyCreatedResponse;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ApiKeyResponse;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.CreateApiKeyRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ResponseTemplate;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.AuthUtil;
import com.github.dawid_stolarczyk.magazyn.Services.ApiKeyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api-keys")
@Tag(name = "API Keys", description = "Management of API keys for external systems and IoT sensors")
@SecurityRequirement(name = "session-cookie")
@RequiredArgsConstructor
public class ApiKeyController {

    private final ApiKeyService apiKeyService;

    @Operation(summary = "Create a new API key [ADMIN only]",
            description = """
                    Generates a new API key with specified scopes and optional warehouse binding.
                    The raw key is returned only once in response — store it securely.
                    Administrators are notified via email about new key creation.
                    """)
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "API key created successfully",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessData.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: API_KEY_NAME_ALREADY_EXISTS, RESOURCE_NOT_FOUND, VALIDATION_ERROR",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<ApiKeyCreatedResponse>> createApiKey(
            @Valid @RequestBody CreateApiKeyRequest request,
            HttpServletRequest httpRequest) {
        Long userId = AuthUtil.getCurrentAuthPrincipal().getUserId();
        ApiKeyCreatedResponse response = apiKeyService.createApiKey(request, userId, httpRequest);
        apiKeyService.sendApiKeyCreationNotification(response.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ResponseTemplate.success(response));
    }

    @Operation(summary = "List all API keys [ADMIN only]",
            description = "Returns all API keys (active and revoked) without secret key values.")
    @ApiResponse(responseCode = "200", description = "Success - returns list of API keys",
            content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessPaged.class)))
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<List<ApiKeyResponse>>> listApiKeys(HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ResponseTemplate.success(apiKeyService.listApiKeys(httpRequest)));
    }

    @Operation(summary = "Get API key details [ADMIN only]")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - returns API key details",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessData.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: RESOURCE_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<ApiKeyResponse>> getApiKey(@PathVariable Long id, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ResponseTemplate.success(apiKeyService.getApiKey(id, httpRequest)));
    }

    @Operation(summary = "Revoke an API key [ADMIN only]",
            description = "Deactivates API key. It will no longer authenticate requests.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "API key revoked",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccess.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: RESOURCE_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<Void>> revokeApiKey(@PathVariable Long id, HttpServletRequest httpRequest) {
        apiKeyService.revokeApiKey(id, httpRequest);
        return ResponseEntity.ok(ResponseTemplate.success());
    }
}
