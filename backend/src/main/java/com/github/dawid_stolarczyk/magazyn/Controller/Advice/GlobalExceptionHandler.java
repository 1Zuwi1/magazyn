package com.github.dawid_stolarczyk.magazyn.Controller.Advice;

import com.github.dawid_stolarczyk.magazyn.Common.Enums.AuthError;
import com.github.dawid_stolarczyk.magazyn.Controller.Dto.ResponseTemplate;
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
        log.info("Validation error", ex);
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
//        log.debug("Authentication error: {}", ex.getCode());
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
        log.warn("Data integrity violation: {}", ex.getMostSpecificCause().getMessage());

        String errorCode = "CONFLICT";
        Throwable rootCause = ex.getRootCause();

        // Najpierw spróbuj użyć kodów błędów SQL (bardziej niezawodne)
        if (rootCause instanceof java.sql.SQLException sqlEx) {
            int sqlErrorCode = sqlEx.getErrorCode();
            String sqlMessage = sqlEx.getMessage();

            // MySQL error codes:
            // 1062 = Duplicate entry
            // 1048 = Column cannot be null
            // 1451 = Cannot delete or update a parent row (foreign key constraint)
            // 1452 = Cannot add or update a child row (foreign key constraint)

            switch (sqlErrorCode) {
                case 1062: // Duplicate entry
                    if (sqlMessage != null) {
                        if (sqlMessage.contains("position") || sqlMessage.contains("rack_id")) {
                            errorCode = "PLACEMENT_CONFLICT";
                        } else if (sqlMessage.contains("barcode") || sqlMessage.contains("code")) {
                            errorCode = "DUPLICATE_CODE";
                        } else if (sqlMessage.contains("email")) {
                            errorCode = "DUPLICATE_EMAIL";
                        } else {
                            errorCode = "DUPLICATE_ENTRY";
                        }
                    }
                    break;
                case 1048: // Column cannot be null
                    errorCode = "NULL_NOT_ALLOWED";
                    break;
                case 1451: // Cannot delete parent row
                case 1452: // Cannot add child row
                    errorCode = "CONSTRAINT_VIOLATION";
                    break;
                default:
                    // Fallback do string matching tylko jeśli kod nie jest rozpoznany
                    errorCode = parseErrorFromMessage(sqlMessage);
                    break;
            }
        } else {
            // Fallback dla innych baz danych lub gdy rootCause nie jest SQLException
            String message = ex.getMostSpecificCause().getMessage();
            errorCode = parseErrorFromMessage(message);
        }

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ResponseTemplate.error(errorCode));
    }

    /**
     * Fallback method for parsing error messages when SQL error codes are not available
     */
    private String parseErrorFromMessage(String message) {
        if (message == null) {
            return "CONFLICT";
        }

        String lowerMessage = message.toLowerCase();
        if (lowerMessage.contains("position") || lowerMessage.contains("rack_id")) {
            return "PLACEMENT_CONFLICT";
        } else if (lowerMessage.contains("duplicate") || lowerMessage.contains("unique")) {
            return "DUPLICATE_ENTRY";
        } else if (lowerMessage.contains("foreign key") || lowerMessage.contains("constraint")) {
            return "CONSTRAINT_VIOLATION";
        }
        return "CONFLICT";
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

        String errorCode = "INTERNAL_ERROR";
        String message = ex.getMessage();

        // Wykryj błąd nie podania warehouseId w endpointach, które tego wymagają
        if (message != null && (message.contains("Required request parameter 'warehouseId'"))) {
            errorCode = "WAREHOUSE_ID_REQUIRED";
        }

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ResponseTemplate.error(errorCode));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ResponseTemplate<String>> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        log.debug("JSON parsing error", ex);

        String errorCode = "MALFORMED_JSON_REQUEST";
        String message = ex.getMessage();

        // Wykryj błąd deserializacji enuma
        if (message != null && (message.contains("Cannot deserialize value") ||
                message.contains("not one of the values accepted for Enum"))) {
            errorCode = "INVALID_ENUM_VALUE";
            log.debug("Invalid enum value provided in request");
        }

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ResponseTemplate.error(errorCode));
    }

}
