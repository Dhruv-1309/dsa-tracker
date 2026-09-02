package com.example.demo.controller;

import com.example.demo.dto.ProblemResponse;
import com.example.demo.security.CustomUserDetails;
import com.example.demo.service.RevisitQueueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/revisit-queue")
@RequiredArgsConstructor
public class RevisitQueueController {

    private final RevisitQueueService revisitQueueService;

    @GetMapping
    public ResponseEntity<List<ProblemResponse>> getQueue(
            @RequestParam String bucket,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        UUID userId = UUID.fromString(userDetails.getId());
        return ResponseEntity.ok(revisitQueueService.getQueue(userId, bucket));
    }
}
