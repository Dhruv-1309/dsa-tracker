package com.example.demo.controller;

import com.example.demo.dto.ProblemRequest;
import com.example.demo.dto.ProblemResponse;
import com.example.demo.security.CustomUserDetails;
import com.example.demo.service.ProblemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/problems")
@RequiredArgsConstructor
public class ProblemController {

    private final ProblemService problemService;

    @GetMapping
    public ResponseEntity<List<ProblemResponse>> getProblems(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) String status,
            Sort sort
    ) {
        UUID userId = UUID.fromString(userDetails.getId());
        return ResponseEntity.ok(problemService.getProblems(userId, search, topic, status, sort));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProblemResponse> getProblem(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        UUID userId = UUID.fromString(userDetails.getId());
        return ResponseEntity.ok(problemService.getProblemById(id, userId));
    }

    @PostMapping
    public ResponseEntity<ProblemResponse> createProblem(
            @Valid @RequestBody ProblemRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        UUID userId = UUID.fromString(userDetails.getId());
        return ResponseEntity.ok(problemService.createProblem(request, userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProblemResponse> updateProblem(
            @PathVariable UUID id,
            @Valid @RequestBody ProblemRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        UUID userId = UUID.fromString(userDetails.getId());
        return ResponseEntity.ok(problemService.updateProblem(id, request, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProblem(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        UUID userId = UUID.fromString(userDetails.getId());
        problemService.deleteProblem(id, userId);
        return ResponseEntity.noContent().build();
    }
}
