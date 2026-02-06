package com.github.dawid_stolarczyk.magazyn.Controller.Inventory;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.*;
import com.github.dawid_stolarczyk.magazyn.Services.Inventory.InboundService;
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
@RequestMapping("/inventory/inbound-operation")
@Tag(name = "Inbound Operations", description = "Endpoints for receiving items into the warehouse")
@RequiredArgsConstructor
@Slf4j
public class InboundController {
    private final InboundService inboundService;

    @Operation(
            summary = "Plan inbound operation",
            description = """
                    Generates a placement plan using intelligent algorithms:

                    **Grouping Algorithm:**
                    - Groups racks by proximity (warehouse → zone → aisle based on marker)
                    - Fills positions in "snake" pattern (row by row, left to right)
                    - Minimizes picking time by placing items close together

                    **Position Reservation (reserve=true):**
                    - Each allocated position is reserved for 5 minutes
                    - Only the requesting user can confirm placement to reserved positions
                    - Reservations automatically expire after 5 minutes

                    **Without Reservation (reserve=false, default):**
                    - Returns optimal positions without locking them
                    """
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - returns placement plan",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = PlacementPlanResponse.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: ITEM_NOT_FOUND, INSUFFICIENT_SPACE, INVALID_INPUT",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping("/plan")
    public ResponseEntity<ResponseTemplate<PlacementPlanResponse>> plan(
            @Valid @RequestBody PlacementPlanRequest request,
            HttpServletRequest httpRequest) {
        InboundService.PlacementPlanResult result = inboundService.buildPlacementPlan(request, httpRequest);
        if (!result.success()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseTemplate.error(result.code() != null ? result.code().name() : "PLACEMENT_INVALID"));
        }
        return ResponseEntity.ok(ResponseTemplate.success(result.response()));
    }

    @Operation(summary = "Execute inbound operation",
            description = "Accepts either itemId or barcode (14 digits) to identify the item. Creates assortments with generated GS1-128 barcodes.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Success - returns created assortments list",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = PlacementConfirmationResponse.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: ITEM_NOT_FOUND, INVALID_INPUT, PLACEMENT_INVALID",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class))),
            @ApiResponse(responseCode = "409", description = "Error codes: PLACEMENT_CONFLICT (position already occupied)",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping("/execute")
    public ResponseEntity<ResponseTemplate<PlacementConfirmationResponse>> execute(
            @Valid @RequestBody PlacementConfirmationRequest request,
            HttpServletRequest httpRequest) {
        PlacementConfirmationResponse response = inboundService.confirmPlacement(request, httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(ResponseTemplate.success(response));
    }
}
