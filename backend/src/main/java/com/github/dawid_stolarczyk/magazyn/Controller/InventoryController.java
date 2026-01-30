package com.github.dawid_stolarczyk.magazyn.Controller;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.*;
import com.github.dawid_stolarczyk.magazyn.Services.InventoryPlacementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/inventory")
@Tag(name = "Inventory", description = "Endpoints for managing inventory placement and storage")
public class InventoryController {
    private final InventoryPlacementService placementService;

    public InventoryController(InventoryPlacementService placementService) {
        this.placementService = placementService;
    }

    @Operation(summary = "Generate a scan-driven placement plan for incoming items")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Placement plan created successfully",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessData.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request or item not found",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping("/placements/plan")
    public ResponseEntity<ResponseTemplate<PlacementPlanResponse>> planPlacement(
            @Valid @RequestBody PlacementPlanRequest request) {
        InventoryPlacementService.PlacementPlanResult result = placementService.buildPlacementPlan(request);
        if (!result.success()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseTemplate.error(result.code() != null ? result.code().name() : null));
        }
        return ResponseEntity.ok(ResponseTemplate.success(result.response()));
    }

    @Operation(summary = "Confirm placement and store items in inventory")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Placement confirmed and resources created",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiSuccessData.class))),
            @ApiResponse(responseCode = "400", description = "Invalid placement or item not found",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "409", description = "Placement conflict",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping("/placements/confirm")
    public ResponseEntity<ResponseTemplate<PlacementConfirmationResponse>> confirmPlacement(
            @Valid @RequestBody PlacementConfirmationRequest request) {
        PlacementConfirmationResponse response = placementService.confirmPlacement(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ResponseTemplate.success(response));
    }
}
