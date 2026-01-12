package com.github.dawid_stolarczyk.magazyn.Controller;

import com.github.dawid_stolarczyk.magazyn.Crypto.CryptoService;
import com.github.dawid_stolarczyk.magazyn.Services.StringCryptoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/crypto")
public class TestEncoderException {
    @Autowired
    private StringCryptoService cryptoService;

    @PostMapping("/test")
    public ResponseEntity<?> encodeTest(@RequestBody Map<String, String> payload) {
        try {
            String testString = payload.get("input");
            String encrypted = cryptoService.encrypt(testString);
            System.out.println(encrypted);
            String decrypted = cryptoService.decrypt(encrypted);
            Map<String, String> response = Map.of(
                    "encrypted", encrypted,
                    "originalText", testString,
                    "decrypted", decrypted);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}
