package com.example.demo.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
public class AttemptRequest {

    private LocalDateTime attemptedAt;

    @NotBlank(message = "Result is required")
    @Size(max = 50, message = "Result cannot exceed 50 characters")
    private String result;

    private boolean understood;
    private boolean logicFound;
    private boolean codeCompleted;

    @PositiveOrZero(message = "Time taken must be a positive number or zero")
    private Integer timeTakenMin;

    @Size(max = 50, message = "Time complexity cannot exceed 50 characters")
    private String timeComplexity;

    @Size(max = 50, message = "Space complexity cannot exceed 50 characters")
    private String spaceComplexity;

    @Min(value = 1, message = "Confidence must be between 1 and 5")
    @Max(value = 5, message = "Confidence must be between 1 and 5")
    private Integer confidence;

    @Size(max = 10000, message = "Approach notes cannot exceed 10000 characters")
    private String approach;

    @Size(max = 10000, message = "Mistakes notes cannot exceed 10000 characters")
    private String mistakes;

    @Size(max = 50000, message = "Code submission cannot exceed 50000 characters")
    private String code;

    @Size(max = 50, message = "Language cannot exceed 50 characters")
    private String language;

    private Set<UUID> mistakeTagIds;
    private LocalDate nextRevisitDate;
}
