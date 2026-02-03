package com.github.dawid_stolarczyk.magazyn.Controller.Inventory;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.*;
import com.github.dawid_stolarczyk.magazyn.Services.Inventory.InventoryPlacementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/inventory")
@Tag(name = "Inventory", description = "Endpoints for managing inventory placement and storage")
@RequiredArgsConstructor
@Slf4j
public class InventoryController {
    private final InventoryPlacementService placementService;

    @Operation(
            summary = "Generate an optimal placement plan for incoming items",
            description = """
                    Generates a placement plan using intelligent algorithms:
                    
                    **Grouping Algorithm:**
                    - Groups racks by proximity (warehouse → zone → aisle based on marker)
                    - Fills positions in "snake" pattern (row by row, left to right)
                    - Minimizes picking time by placing items close together
                    
                    **Position Reservation (reserve=true):**
                    - Each allocated position (rack + x,y coordinate) is reserved for 5 minutes
                    - Only the requesting user can confirm placement to reserved positions
                    - Other users will NOT see reserved positions as available
                    - Reservations automatically expire after 5 minutes
                    - Response includes `reserved=true`, `reservedUntil` timestamp, and `reservedCount`
                    
                    **Without Reservation (reserve=false, default):**
                    - Returns optimal positions without locking them
                    - Other users may use the same positions
                    - Response includes `reserved=false`
                    
                    Use `reserve=true` when the user needs guaranteed positions for immediate placement.
                    """
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - returns placement plan (slots with rackId, positionX, positionY, reserved, reservedUntil)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = PlacementPlanResponse.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: ITEM_NOT_FOUND, INSUFFICIENT_SPACE, INVALID_INPUT",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping("/placements/plan")
    public ResponseEntity<ResponseTemplate<PlacementPlanResponse>> planPlacement(
            @Valid @RequestBody PlacementPlanRequest request,
            HttpServletRequest httpRequest) {
        InventoryPlacementService.PlacementPlanResult result = placementService.buildPlacementPlan(request, httpRequest);
        if (!result.success()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseTemplate.error(result.code() != null ? result.code().name() : "PLACEMENT_INVALID"));
        }
        return ResponseEntity.ok(ResponseTemplate.success(result.response()));
    }

    @Operation(summary = "Confirm placement and create assortments",
            description = "Accepts either itemId or barcode (14 digits) to identify the item. Creates assortments with generated GS1-128 barcodes.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Success - returns created assortments list",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = PlacementConfirmationResponse.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: ITEM_NOT_FOUND, INVALID_INPUT, PLACEMENT_INVALID",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "409", description = "Error codes: PLACEMENT_CONFLICT (position already occupied)",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping("/placements/confirm")
    public ResponseEntity<ResponseTemplate<PlacementConfirmationResponse>> confirmPlacement(
            @Valid @RequestBody PlacementConfirmationRequest request,
            HttpServletRequest httpRequest) {
        PlacementConfirmationResponse response = placementService.confirmPlacement(request, httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(ResponseTemplate.success(response));
    }
}
