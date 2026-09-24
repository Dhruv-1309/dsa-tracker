package com.example.demo.controller;

import com.example.demo.dto.MistakeTagResponse;
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
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/mistake-tags")
@RequiredArgsConstructor
public class MistakeTagController {

    private final MistakeTagRepository mistakeTagRepository;

    @GetMapping
    public ResponseEntity<List<MistakeTagResponse>> getMistakeTags(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        UUID userId = UUID.fromString(userDetails.getId());
        List<MistakeTagResponse> response = mistakeTagRepository.findAllAvailableForUser(userId)
                .stream()
                .map(tag -> MistakeTagResponse.builder()
                        .id(tag.getId())
                        .name(tag.getName())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }
}
