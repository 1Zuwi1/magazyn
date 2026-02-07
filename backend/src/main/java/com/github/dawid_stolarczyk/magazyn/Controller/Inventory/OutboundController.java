package com.github.dawid_stolarczyk.magazyn.Controller.Inventory;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.*;
import com.github.dawid_stolarczyk.magazyn.Services.Inventory.OutboundService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/inventory/outbound-operation")
@Tag(name = "Outbound Operations", description = "Endpoints for issuing items from warehouse with FIFO compliance")
@RequiredArgsConstructor
public class OutboundController {

    private final OutboundService outboundService;

    @Operation(summary = "Plan outbound operation",
            description = "Returns FIFO-ordered pick list showing which assortments to pick and their locations. Read-only, does not modify data.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - returns pick list in FIFO order",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = OutboundPlanResponse.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: ITEM_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping("/plan")
    public ResponseEntity<ResponseTemplate<OutboundPlanResponse>> plan(
            @Valid @RequestBody OutboundPlanRequest request,
            HttpServletRequest httpRequest) {
        OutboundPlanResponse response = outboundService.plan(request, httpRequest);
        return ResponseEntity.ok(ResponseTemplate.success(response));
    }

    @Operation(summary = "Check FIFO compliance for an assortment",
            description = "Checks if a specific assortment is the oldest of its item type. Returns older assortments if not FIFO compliant. Read-only.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - returns FIFO compliance check result",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = OutboundCheckResponse.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: ASSORTMENT_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping("/check")
    public ResponseEntity<ResponseTemplate<OutboundCheckResponse>> check(
            @Valid @RequestBody OutboundCheckRequest request,
            HttpServletRequest httpRequest) {
        OutboundCheckResponse response = outboundService.check(request, httpRequest);
        return ResponseEntity.ok(ResponseTemplate.success(response));
    }

    @Operation(summary = "Execute outbound operation",
            description = """
                    Issues assortments from the warehouse. Deletes assortments and creates audit records.
                    
                    **FIFO Validation:**
                    - `skipFifo=false` (default): Rejects if older assortments of the same item exist (OUTBOUND_FIFO_VIOLATION)
                    - `skipFifo=true`: Allows pick but records `fifoCompliant=false` in the audit trail
                    
                    The entire operation is transactional — all assortments are issued or none are.
                    """)
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success - assortments issued",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = OutboundExecuteResponse.class))),
            @ApiResponse(responseCode = "400", description = "Error codes: ASSORTMENT_NOT_FOUND, OUTBOUND_FIFO_VIOLATION, USER_NOT_FOUND",
                    content = @Content(schema = @Schema(implementation = ResponseTemplate.ApiError.class)))
    })
    @PostMapping("/execute")
    public ResponseEntity<ResponseTemplate<OutboundExecuteResponse>> execute(
            @Valid @RequestBody OutboundExecuteRequest request,
            HttpServletRequest httpRequest) {
        OutboundExecuteResponse response = outboundService.execute(request, httpRequest);
        return ResponseEntity.ok(ResponseTemplate.success(response));
    }
}
