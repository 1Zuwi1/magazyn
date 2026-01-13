package com.github.dawid_stolarczyk.magazyn.Controller;

import com.github.dawid_stolarczyk.magazyn.Crypto.CryptoService;
import com.github.dawid_stolarczyk.magazyn.Crypto.FileCryptoService;
import com.github.dawid_stolarczyk.magazyn.Services.StringCryptoService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/crypto")
public class TestEncoderException {
    @Autowired
    private StringCryptoService cryptoService;
    @Autowired
    private FileCryptoService fileCryptoService;

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
