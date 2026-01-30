package com.github.dawid_stolarczyk.magazyn.Controller.Advice;

import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ResponseTemplate;
import com.github.dawid_stolarczyk.magazyn.Exception.RateLimitExceededException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ResponseTemplate<String>> handleDataIntegrity(DataIntegrityViolationException ex) {
        log.warn("Data integrity violation", ex);
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ResponseTemplate.error("CONFLICT"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ResponseTemplate<String>> handleOtherExceptions(Exception ex) {
        log.error("Internal server error", ex);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ResponseTemplate.error("INTERNAL_ERROR"));
    }

}
