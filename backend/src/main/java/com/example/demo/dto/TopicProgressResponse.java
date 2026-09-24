package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class TopicProgressResponse {
    private UUID topicId;
    private String topicName;
    private long totalProblems;
    private long solvedProblems; // "Solved" or "Solved optimally"
}
