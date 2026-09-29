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
public class IncomingFriendRequestResponse {
    private UUID id;
    private UUID requesterId;
    private String requesterName;
    private LocalDateTime createdAt;
}
