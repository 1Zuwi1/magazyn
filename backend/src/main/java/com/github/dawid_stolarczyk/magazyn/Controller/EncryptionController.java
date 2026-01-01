package com.github.dawid_stolarczyk.magazyn.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.github.dawid_stolarczyk.magazyn.Controller.DTOs.ResponseTemplate;
import com.github.dawid_stolarczyk.magazyn.Model.Services.EncryptionService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

@RestController
@RequestMapping("/encrypt")
public class EncryptionController {

  private static class EncryptionTestResult {
    private String original;
    private String encrypted;
    private String decrypted;

    public EncryptionTestResult(String original, String encrypted, String decrypted) {
      this.original = original;
      this.encrypted = encrypted;
      this.decrypted = decrypted;
    }

    public String getOriginal() {
      return original;
    }

    public String getEncrypted() {
      return encrypted;
    }

    public String getDecrypted() {
      return decrypted;
    }
  }

  private final EncryptionService encryptionService;

  public EncryptionController(EncryptionService encryptionService) {
    this.encryptionService = encryptionService;
  }

  @Operation(summary = "Health check endpoint")
  @ApiResponses(value = {
      @ApiResponse(responseCode = "200", description = "API is operational")
  })
  @GetMapping
  public ResponseEntity<ResponseTemplate<String>> testEndpoint() {
    ResponseTemplate<String> response = new ResponseTemplate<>(true, "API is operational");
    return ResponseEntity.ok(response);
  }

  @Operation(summary = "Encrypt and decrypt text")
  @ApiResponses(value = {
      @ApiResponse(responseCode = "200", description = "Text encrypted and decrypted successfully")
  })
  @PostMapping("/test")
  public ResponseEntity<ResponseTemplate<EncryptionTestResult>> encryptAndDecrypt(
      @org.springframework.web.bind.annotation.RequestBody String text) {
    String encrypted = encryptionService.encrypt(text);
    String decrypted = encryptionService.decrypt(encrypted);
    EncryptionTestResult result = new EncryptionTestResult(text, encrypted, decrypted);
    ResponseTemplate<EncryptionTestResult> response = new ResponseTemplate<>(true, result);
    return ResponseEntity.ok(response);
  }
}
