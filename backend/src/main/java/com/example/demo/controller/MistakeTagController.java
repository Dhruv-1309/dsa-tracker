package com.example.demo.controller;

import com.example.demo.model.MistakeTag;
import com.example.demo.repository.MistakeTagRepository;
import com.example.demo.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/mistake-tags")
@RequiredArgsConstructor
public class MistakeTagController {

    private final MistakeTagRepository mistakeTagRepository;

    @GetMapping
    public ResponseEntity<List<MistakeTag>> getMistakeTags(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        UUID userId = UUID.fromString(userDetails.getId());
        return ResponseEntity.ok(mistakeTagRepository.findAllAvailableForUser(userId));
    }
}
