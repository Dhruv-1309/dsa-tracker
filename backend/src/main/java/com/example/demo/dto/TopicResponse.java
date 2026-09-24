package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class TopicResponse {
    private UUID id;
    private String name;
    private boolean isSystem;
    private long problemCount;
}
