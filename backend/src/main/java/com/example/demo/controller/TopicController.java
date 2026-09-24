package com.example.demo.controller;

import com.example.demo.dto.TopicRequest;
import com.example.demo.dto.TopicResponse;
import com.example.demo.security.CustomUserDetails;
import com.example.demo.service.TopicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/topics")
@RequiredArgsConstructor
public class TopicController {

    private final TopicService topicService;

    @GetMapping
    public ResponseEntity<List<TopicResponse>> getTopics(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        UUID userId = UUID.fromString(userDetails.getId());
        return ResponseEntity.ok(topicService.getTopics(userId));
    }

    @PostMapping
    public ResponseEntity<TopicResponse> createTopic(
            @RequestBody TopicRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        UUID userId = UUID.fromString(userDetails.getId());
        return ResponseEntity.ok(topicService.createTopic(request, userId));
    }
}
