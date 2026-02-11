package com.github.dawid_stolarczyk.magazyn.Controller;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.RackReportRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.RackReportResponse;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ResponseTemplate;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.TelemetryRequest;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Rack;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.ApiKeyScope;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.RackRepository;
import com.github.dawid_stolarczyk.magazyn.Security.Auth.Entity.ApiKeyPrincipal;
import com.github.dawid_stolarczyk.magazyn.Services.Alerts.RackReportService;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.RateLimitOperation;
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
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Telemetry endpoint for IoT sensors.
 * Authenticated via X-API-KEY header with SENSOR_WRITE scope.
 * Validates that the API key's warehouse matches the rack's warehouse.
 */
@RestController
@RequestMapping("/v1/telemetry")
@Tag(name = "Telemetry", description = "IoT sensor data ingestion endpoint")
@SecurityRequirement(name = "api-key")
@RequiredArgsConstructor
@Slf4j
public class TelemetryController {

    private final RackReportService rackReportService;
    private final RackRepository rackRepository;
    private final Bucket4jRateLimiter rateLimiter;

    @Operation(summary = "Submit sensor telemetry data",
            description = """
                    Receives temperature and/or weight measurements from IoT sensors.
                    Requires a valid API key with SENSOR_WRITE scope in the X-API-KEY header.
                    
                    If the API key is bound to a specific warehouse, the target rack must
                    belong to that warehouse. Global keys (no warehouse binding) can submit
                    data for any rack.
                    
                    The data is processed as a rack report — alerts are generated automatically
                    if thresholds are exceeded.
                    """)
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Telemetry data accepted and processed",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessData.class))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid API key",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "403", description = "Error codes: INSUFFICIENT_SCOPE, WAREHOUSE_ACCESS_DENIED",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: RACK_NOT_FOUND, VALIDATION_ERROR",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping
    public ResponseEntity<ResponseTemplate<RackReportResponse>> submitTelemetry(
            @Valid @RequestBody TelemetryRequest request,
            HttpServletRequest httpRequest) {

        ApiKeyPrincipal principal = getApiKeyPrincipal();

        // Validate SENSOR_WRITE scope
        if (!principal.hasScope(ApiKeyScope.SENSOR_WRITE)) {
            throw new IllegalArgumentException("INSUFFICIENT_SCOPE");
        }

        // Rate limit by API key ID
        rateLimiter.consumeOrThrow("apikey:" + principal.getApiKeyId(), RateLimitOperation.TELEMETRY_WRITE);

        // Validate rack exists and warehouse binding
        Rack rack = rackRepository.findById(request.getRackId())
                .orElseThrow(() -> new IllegalArgumentException("RACK_NOT_FOUND"));

        if (principal.getWarehouseId() != null) {
            if (rack.getWarehouse() == null) {
                log.warn("API key '{}' (warehouse={}) attempted telemetry for orphaned rack {} (no warehouse assigned)",
                        principal.getApiKeyName(), principal.getWarehouseId(), rack.getId());
                throw new IllegalArgumentException("WAREHOUSE_ACCESS_DENIED");
            }
            Long rackWarehouseId = rack.getWarehouse().getId();
            if (!principal.getWarehouseId().equals(rackWarehouseId)) {
                log.warn("API key '{}' (warehouse={}) attempted telemetry for rack {} (warehouse={})",
                        principal.getApiKeyName(), principal.getWarehouseId(),
                        rack.getId(), rackWarehouseId);
                throw new IllegalArgumentException("WAREHOUSE_ACCESS_DENIED");
            }
        }

        // Convert to RackReportRequest and delegate to existing service
        RackReportRequest reportRequest = RackReportRequest.builder()
                .rackId(request.getRackId())
                .currentWeight(request.getCurrentWeight())
                .currentTemperature(request.getCurrentTemperature())
                .sensorId(request.getSensorId())
                .build();

        RackReportResponse response = rackReportService.processReport(reportRequest, httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(ResponseTemplate.success(response));
    }

    private ApiKeyPrincipal getApiKeyPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof ApiKeyPrincipal)) {
            throw new IllegalArgumentException("API_KEY_REQUIRED");
        }
        return (ApiKeyPrincipal) auth.getPrincipal();
    }
}
