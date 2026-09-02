package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AttemptResponse {
    private UUID id;
    private UUID problemId;
    private LocalDate date;
    private String thinkingResult;
    private String codingResult;
    private String timeComplexity;
    private String spaceComplexity;
    private String confidence;
    private String notes;
    private LocalDate nextRevisitDate;
    private LocalDateTime createdAt;
}
