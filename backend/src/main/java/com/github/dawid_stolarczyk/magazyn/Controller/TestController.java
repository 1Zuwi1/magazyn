package com.github.dawid_stolarczyk.magazyn.Controller;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ResponseTemplate;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/health")
public class TestController {

    @Operation(summary = "Health check endpoint")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "API is operational")
    })
    @GetMapping
    public ResponseEntity<ResponseTemplate<String>> testEndpoint() {
        ResponseTemplate<String> response = ResponseTemplate.success("API is operational");
        return ResponseEntity.ok(response);
    }
}
