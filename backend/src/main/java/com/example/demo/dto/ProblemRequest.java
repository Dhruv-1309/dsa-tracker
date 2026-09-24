package com.example.demo.dto;

import com.example.demo.model.Difficulty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.Set;
import java.util.UUID;

@Data
public class ProblemRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title cannot exceed 255 characters")
    private String title;

    @Size(max = 50, message = "Platform name cannot exceed 50 characters")
    private String platform;

    @Size(max = 500, message = "URL cannot exceed 500 characters")
    private String url;

    @NotNull(message = "Difficulty is required")
    private Difficulty difficulty;

    @NotNull(message = "Primary topic is required")
    private UUID primaryTopicId;

    private Set<UUID> extraTopicIds;

    @Size(max = 50, message = "Optimal time complexity cannot exceed 50 characters")
    private String optimalTime;

    @Size(max = 50, message = "Optimal space complexity cannot exceed 50 characters")
    private String optimalSpace;

    private AttemptRequest firstAttempt;
}
