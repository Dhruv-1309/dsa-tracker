package com.example.demo.dto;

import com.example.demo.model.Difficulty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendProblemDetailResponse {
    private UUID id;
    private String title;
    private String platform;
    private String url;
    private Difficulty difficulty;
    private UUID primaryTopicId;
    private String primaryTopicName;
    private Set<String> extraTopicNames;
    private String optimalTime;
    private String optimalSpace;
    private String currentStatus;
    private LocalDateTime createdAt;
    private List<AttemptResponse> attempts;
}
