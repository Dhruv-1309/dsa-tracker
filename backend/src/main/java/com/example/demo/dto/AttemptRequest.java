package com.example.demo.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
public class AttemptRequest {
    private LocalDateTime attemptedAt;
    private String result;
    private boolean understood;
    private boolean logicFound;
    private boolean codeCompleted;
    private Integer timeTakenMin;
    private String timeComplexity;
    private String spaceComplexity;
    private Integer confidence; // 1-5
    private String approach;
    private String mistakes;
    private String code;
    private String language;
    private Set<UUID> mistakeTagIds;
    private LocalDate nextRevisitDate;
}
