package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
public class AttemptResponse {
    private UUID id;
    private UUID problemId;
    private LocalDateTime attemptedAt;
    private String result;
    private boolean understood;
    private boolean logicFound;
    private boolean codeCompleted;
    private Integer timeTakenMin;
    private String timeComplexity;
    private String spaceComplexity;
    private Integer confidence;
    private String approach;
    private String mistakes;
    private String code;
    private String language;
    private Set<String> mistakeTags;
}
