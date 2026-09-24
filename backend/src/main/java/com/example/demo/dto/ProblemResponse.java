package com.example.demo.dto;

import com.example.demo.model.Difficulty;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
public class ProblemResponse {
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
    private LocalDateTime lastSuccessfulAt;
    private LocalDate nextRevisitDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
