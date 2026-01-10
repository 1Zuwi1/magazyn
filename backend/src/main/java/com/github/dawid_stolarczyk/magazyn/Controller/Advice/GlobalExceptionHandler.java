package com.github.dawid_stolarczyk.magazyn.Controller.Advice;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ResponseTemplate;
import com.github.dawid_stolarczyk.magazyn.Exception.RateLimitExceededException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

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
                .body(new ResponseTemplate<>(false, "Too many requests, please try again later."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ResponseTemplate<String>> handleOtherExceptions(Exception ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ResponseTemplate<>(false, null, ex.getMessage()));
    }

}
