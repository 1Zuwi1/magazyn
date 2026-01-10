package com.github.dawid_stolarczyk.magazyn.Controller.Advice;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ResponseTemplate;
import com.github.dawid_stolarczyk.magazyn.Exception.RateLimitExceededException;
import com.github.dawid_stolarczyk.magazyn.Exception.TwoFactorNotVerifiedException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

// Dodac obsluge 403 Forbidden
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ResponseTemplate<String>> handleValidation(
            MethodArgumentNotValidException ex
    ) {
        FieldError fieldError = ex.getBindingResult()
                .getFieldErrors()
                .get(0);
        String message = "%s: %s".formatted(fieldError.getField(), fieldError.getDefaultMessage());

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ResponseTemplate<>(false, message));
    }

    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<ResponseTemplate<String>> handleRateLimitExceeded(
            RateLimitExceededException ex
    ) {
        return ResponseEntity
                .status(HttpStatus.TOO_MANY_REQUESTS)
                .body(new ResponseTemplate<>(false, ex.getMessage()));
    }

    @ExceptionHandler(TwoFactorNotVerifiedException.class)
    public ResponseEntity<ResponseTemplate<String>> handleTwoFactorNotVerified(
            TwoFactorNotVerifiedException ex
    ) {
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(new ResponseTemplate<>(false, ex.getMessage()));
    }
}
