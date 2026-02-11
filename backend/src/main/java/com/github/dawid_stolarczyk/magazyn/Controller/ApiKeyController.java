package com.github.dawid_stolarczyk.magazyn.Controller;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ApiKeyCreatedResponse;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ApiKeyResponse;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.CreateApiKeyRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ResponseTemplate;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.AuthUtil;
import com.github.dawid_stolarczyk.magazyn.Services.ApiKeyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
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
                    Generates a new API key with the specified scopes and optional warehouse binding.
                    The raw key is returned only once in the response — store it securely.
                    Administrators are notified via email about the new key creation.
                    """)
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "API key created successfully"),
            @ApiResponse(responseCode = "400", description = "Error codes: API_KEY_NAME_ALREADY_EXISTS, RESOURCE_NOT_FOUND, VALIDATION_ERROR")
    })
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<ApiKeyCreatedResponse>> createApiKey(
            @Valid @RequestBody CreateApiKeyRequest request) {
        Long userId = AuthUtil.getCurrentAuthPrincipal().getUserId();
        ApiKeyCreatedResponse response = apiKeyService.createApiKey(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ResponseTemplate.success(response));
    }

    @Operation(summary = "List all API keys [ADMIN only]",
            description = "Returns all API keys (active and revoked) without the secret key values.")
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<List<ApiKeyResponse>>> listApiKeys() {
        return ResponseEntity.ok(ResponseTemplate.success(apiKeyService.listApiKeys()));
    }

    @Operation(summary = "Get API key details [ADMIN only]")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success"),
            @ApiResponse(responseCode = "400", description = "Error codes: RESOURCE_NOT_FOUND")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<ApiKeyResponse>> getApiKey(@PathVariable Long id) {
        return ResponseEntity.ok(ResponseTemplate.success(apiKeyService.getApiKey(id)));
    }

    @Operation(summary = "Revoke an API key [ADMIN only]",
            description = "Deactivates the API key. It will no longer authenticate requests.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "API key revoked"),
            @ApiResponse(responseCode = "400", description = "Error codes: RESOURCE_NOT_FOUND")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseTemplate<Void>> revokeApiKey(@PathVariable Long id) {
        apiKeyService.revokeApiKey(id);
        return ResponseEntity.ok(ResponseTemplate.success());
    }
}
