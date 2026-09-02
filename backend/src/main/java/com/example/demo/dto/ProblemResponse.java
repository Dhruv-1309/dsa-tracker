package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ProblemResponse {
    private UUID id;
    private String name;
    private String topic;
    private String link;
    private Integer difficulty;
    private String approachNotes;
    private String status;
    private String confidence;
    private LocalDate nextRevisitDate;
    private Integer totalAttempts;
    private Integer timesSolved;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
