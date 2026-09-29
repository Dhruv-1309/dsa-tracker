package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendResponse {
    private UUID id;
    private UUID friendUserId;
    private String displayName;
    private String email;
    private LocalDateTime respondedAt;
}
