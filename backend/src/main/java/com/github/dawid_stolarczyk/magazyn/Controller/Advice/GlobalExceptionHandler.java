package com.github.dawid_stolarczyk.magazyn.Controller.Advice;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ResponseTemplate;
import com.github.dawid_stolarczyk.magazyn.Common.Enums.AuthError;
import com.github.dawid_stolarczyk.magazyn.Exception.AuthenticationException;
import com.github.dawid_stolarczyk.magazyn.Exception.RateLimitExceededException;
import com.github.dawid_stolarczyk.magazyn.Exception.TwoFactorNotVerifiedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ResponseTemplate<String>> handleValidation(
            MethodArgumentNotValidException ex
    ) {
        log.debug("Validation error", ex);
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ResponseTemplate.error("VALIDATION_ERROR"));
    }

    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<ResponseTemplate<String>> handleRateLimitExceeded(
            RateLimitExceededException ex
    ) {
        log.debug("Rate limit exceeded", ex);
        return ResponseEntity
                .status(HttpStatus.TOO_MANY_REQUESTS)
                .body(ResponseTemplate.error("RATE_LIMIT_EXCEEDED"));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ResponseTemplate<String>> handleAccessDenied(AccessDeniedException ex) {
        log.debug("Access denied: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ResponseTemplate.error(AuthError.ACCESS_FORBIDDEN.name()));
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ResponseTemplate<String>> handleAuthException(AuthenticationException ex) {
        log.debug("Authentication error: {}", ex.getCode());
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ResponseTemplate.error(ex.getCode() != null ? ex.getCode() : "UNAUTHORIZED"));
    }

    @ExceptionHandler(TwoFactorNotVerifiedException.class)
    public ResponseEntity<ResponseTemplate<String>> handle2FAException(TwoFactorNotVerifiedException ex) {
        log.debug("2FA verification required");
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ResponseTemplate.error("TWO_FACTOR_REQUIRED"));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ResponseTemplate<String>> handleDataIntegrity(DataIntegrityViolationException ex) {
        log.warn("Data integrity violation: {}", ex.getMessage(), ex);

        // Rozróżnienie typów konfliktów na podstawie komunikatu wyjątku
        String errorCode = "CONFLICT";
        String message = ex.getMessage();

        if (message != null) {
            if (message.contains("position") || message.contains("rack_id")) {
                errorCode = "PLACEMENT_CONFLICT";
            } else if (message.contains("duplicate") || message.contains("unique")) {
                errorCode = "DUPLICATE_ENTRY";
            } else if (message.contains("foreign key") || message.contains("constraint")) {
                errorCode = "CONSTRAINT_VIOLATION";
            }
        }

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ResponseTemplate.error(errorCode));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ResponseTemplate<String>> handleValidation(IllegalArgumentException ex) {
        log.debug("Validation error", ex);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ResponseTemplate.error(ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ResponseTemplate<String>> handleOtherExceptions(Exception ex) {
        log.error("Internal server error", ex);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ResponseTemplate.error("INTERNAL_ERROR"));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ResponseTemplate<String>> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        log.debug("Malformed JSON request", ex);
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ResponseTemplate.error("MALFORMED_JSON_REQUEST"));
    }

}
