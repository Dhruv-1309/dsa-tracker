package com.example.demo.dto;

import com.example.demo.model.Difficulty;
import lombok.Data;
import java.util.Set;
import java.util.UUID;

@Data
public class ProblemRequest {
    private String title;
    private String platform;
    private String url;
    private Difficulty difficulty;
    private UUID primaryTopicId;
    private Set<UUID> extraTopicIds;
    private String optimalTime;
    private String optimalSpace;
    private AttemptRequest firstAttempt; // Optional first attempt
}
