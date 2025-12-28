package com.github.dawid_stolarczyk.magazyn.Controller;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/upo")
public class ExampleController {
    @Operation(summary = "Example endpoint to check 2fa status functionality.")
    @GetMapping
    public String hello() {
        return "Hello, World!";
    }
}
