package com.example.demo.controller;

import com.example.demo.dto.AttemptRequest;
import com.example.demo.dto.AttemptResponse;
import com.example.demo.security.CustomUserDetails;
import com.example.demo.service.AttemptService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/problems/{problemId}/attempts")
@RequiredArgsConstructor
public class AttemptController {

    private final AttemptService attemptService;

    @PostMapping
    public ResponseEntity<AttemptResponse> createAttempt(
            @PathVariable UUID problemId,
            @Valid @RequestBody AttemptRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        UUID userId = UUID.fromString(userDetails.getId());
        return ResponseEntity.ok(attemptService.logAttempt(problemId, request, userId));
    }

    @GetMapping
    public ResponseEntity<List<AttemptResponse>> getAttempts(
            @PathVariable UUID problemId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        UUID userId = UUID.fromString(userDetails.getId());
        return ResponseEntity.ok(attemptService.getAttemptsForProblem(problemId, userId));
    }
}
