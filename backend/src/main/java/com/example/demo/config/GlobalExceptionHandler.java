package com.example.demo.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatus(ResponseStatusException ex) {
        String correlationId = UUID.randomUUID().toString();
        log.warn("[CorrelationId: {}] ResponseStatusException {}: {}", correlationId, ex.getStatusCode(), ex.getReason());

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", ex.getStatusCode().value());
        body.put("error", ex.getReason());
        body.put("correlationId", correlationId);
        return new ResponseEntity<>(body, ex.getStatusCode());
    }

    @ExceptionHandler({BadCredentialsException.class, org.springframework.security.core.AuthenticationException.class})
    public ResponseEntity<Map<String, Object>> handleAuthenticationException(Exception ex) {
        String correlationId = UUID.randomUUID().toString();
        log.warn("[CorrelationId: {}] Authentication failed", correlationId);

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", HttpStatus.UNAUTHORIZED.value());
        body.put("error", "Invalid email or password");
        body.put("correlationId", correlationId);
        return new ResponseEntity<>(body, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        String correlationId = UUID.randomUUID().toString();
        log.warn("[CorrelationId: {}] Invalid argument: {}", correlationId, ex.getMessage());

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Invalid request parameter or syntax");
        body.put("correlationId", correlationId);
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        String correlationId = UUID.randomUUID().toString();
        log.warn("[CorrelationId: {}] Validation failed for request: {}", correlationId, ex.getMessage());

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Validation failed for request parameters");
        body.put("correlationId", correlationId);
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleNotReadable(Exception ex) {
        String correlationId = UUID.randomUUID().toString();
        log.warn("[CorrelationId: {}] Malformed JSON payload received", correlationId);

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Malformed or unreadable request body");
        body.put("correlationId", correlationId);
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
        String correlationId = UUID.randomUUID().toString();
        // Server-side logs receive the full exception and stack trace
        log.error("[CorrelationId: {}] Unhandled server exception: {}", correlationId, ex.getMessage(), ex);

        // Client response receives only generic message and correlation ID - zero internal data or stack traces
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        body.put("error", "An internal error occurred. Please contact support referencing this correlation ID.");
        body.put("correlationId", correlationId);
        return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
