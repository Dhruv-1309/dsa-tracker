package com.example.demo.dto;

import com.example.demo.model.Difficulty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendSummaryProblemDto {
    private UUID id;
    private String title;
    private String platform;
    private String url;
    private Difficulty difficulty;
    private String primaryTopicName;
    private String currentStatus;
}
