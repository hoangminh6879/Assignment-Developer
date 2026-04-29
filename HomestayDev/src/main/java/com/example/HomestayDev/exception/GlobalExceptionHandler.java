package com.example.HomestayDev.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        ex.printStackTrace();
        Map<String, String> response = new HashMap<>();
        String errorMsg = ex.getClass().getSimpleName() + ": " + ex.getMessage();
        if (ex.getCause() != null) {
            errorMsg += " | Cause: " + ex.getCause().getClass().getSimpleName() + ": " + ex.getCause().getMessage();
        }
        response.put("message", errorMsg);
        return ResponseEntity.status(400).body(response);
    }
}
