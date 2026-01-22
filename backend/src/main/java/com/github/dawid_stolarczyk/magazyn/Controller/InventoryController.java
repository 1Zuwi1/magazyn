package com.github.dawid_stolarczyk.magazyn.Controller;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.PlacementConfirmationRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.PlacementConfirmationResponse;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.PlacementPlanRequest;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ResponseTemplate;
import com.github.dawid_stolarczyk.magazyn.Services.InventoryPlacementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/inventory")
public class InventoryController {
    @Autowired
    private InventoryPlacementService placementService;

    @Operation(summary = "Generate a scan-driven placement plan for incoming items")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Placement plan created"),
            @ApiResponse(responseCode = "400", description = "Invalid request or item not found")
    })
    @PostMapping("/placements/plan")
    public ResponseEntity<ResponseTemplate<?>> planPlacement(
            @Valid @RequestBody PlacementPlanRequest request) {
        InventoryPlacementService.PlacementPlanResult result = placementService.buildPlacementPlan(request);
        if (!result.success()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseTemplate.error(result.code()));
        }
        return ResponseEntity.ok(ResponseTemplate.success(result.response()));
    }

    @Operation(summary = "Confirm placement and store items in inventory")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Placement confirmed"),
            @ApiResponse(responseCode = "400", description = "Invalid placement or item not found")
    })
    @PostMapping("/placements/confirm")
    public ResponseEntity<ResponseTemplate<PlacementConfirmationResponse>> confirmPlacement(
            @Valid @RequestBody PlacementConfirmationRequest request) {
        PlacementConfirmationResponse response = placementService.confirmPlacement(request);
        return ResponseEntity.ok(ResponseTemplate.success(response));
    }
}
