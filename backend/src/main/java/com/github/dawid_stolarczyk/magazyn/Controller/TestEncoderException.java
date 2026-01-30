package com.github.dawid_stolarczyk.magazyn.Controller;

import com.github.dawid_stolarczyk.magazyn.Crypto.FileCryptoService;
import com.github.dawid_stolarczyk.magazyn.Services.StringCryptoService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/crypto")
@RequiredArgsConstructor
@Slf4j
public class TestEncoderException {
    private final StringCryptoService cryptoService;
    private final FileCryptoService fileCryptoService;

    @PostMapping("/test")
    public ResponseEntity<?> encodeTest(@RequestBody Map<String, String> payload) {
        try {
            String testString = payload.get("input");
            String encrypted = cryptoService.encrypt(testString);
            log.info("Encrypted test string: {}", encrypted);
            String decrypted = cryptoService.decrypt(encrypted);
            Map<String, String> response = Map.of(
                    "encrypted", encrypted,
                    "decrypted", decrypted
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Crypto test failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PostMapping("/encrypt-file")
    public void encrypt(@RequestParam MultipartFile file, HttpServletResponse response) throws Exception {
        response.setContentType("application/octet-stream");
        response.setHeader("Content-Disposition", "attachment; filename=\"encrypted.dat\"");

        fileCryptoService.encrypt(file.getInputStream(), response.getOutputStream());
    }

    @PostMapping("/decrypt-file")
    public void decrypt(@RequestParam MultipartFile file, HttpServletResponse response) throws Exception {
        response.setContentType("application/octet-stream");
        response.setHeader("Content-Disposition", "attachment; filename=\"decrypted\"");

        fileCryptoService.decrypt(file.getInputStream(), response.getOutputStream());
    }
}
