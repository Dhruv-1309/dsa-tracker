package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendSummaryResponse {
    private UUID friendUserId;
    private String displayName;
    private String email;
    private List<FriendSummaryProblemDto> problems;
    private List<FriendSummaryProblemDto> solvedProblems;
    private List<HeatmapEntry> heatmap;
}
