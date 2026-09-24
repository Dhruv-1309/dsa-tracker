package com.example.demo.controller;

import com.example.demo.dto.HeatmapEntry;
import com.example.demo.dto.MistakeFrequencyResponse;
import com.example.demo.dto.StatsSummaryResponse;
import com.example.demo.dto.TopicProgressResponse;
import com.example.demo.security.CustomUserDetails;
import com.example.demo.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    @GetMapping("/summary")
    public ResponseEntity<StatsSummaryResponse> getSummary(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(statsService.getSummary(UUID.fromString(userDetails.getId())));
    }

    @GetMapping("/heatmap")
    public ResponseEntity<List<HeatmapEntry>> getHeatmap(
            @RequestParam int year,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(statsService.getHeatmap(UUID.fromString(userDetails.getId()), year));
    }

    @GetMapping("/topics")
    public ResponseEntity<List<TopicProgressResponse>> getTopicsProgress(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(statsService.getTopicsProgress(UUID.fromString(userDetails.getId())));
    }

    @GetMapping("/mistakes")
    public ResponseEntity<List<MistakeFrequencyResponse>> getMistakeFrequencies(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(statsService.getMistakeFrequencies(UUID.fromString(userDetails.getId())));
    }
}
