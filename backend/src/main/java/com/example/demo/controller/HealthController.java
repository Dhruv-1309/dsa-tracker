package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Simple health check endpoint for uptime monitoring (UptimeRobot, etc.).
 * Publicly accessible — no auth required (see SecurityConfig).
 */
@RestController
public class HealthController {

    @GetMapping({"/health", "/api/health"})
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP"));
    }
}
