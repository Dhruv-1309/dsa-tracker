package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;
import java.util.Map;
import java.util.List;

@Data
@Builder
public class StatsSummaryResponse {
    private Map<String, Long> statusCounts;
    private Map<String, Long> difficultyCounts;
    private Map<String, Long> platformCounts;
    private long totalProblems;
    private long dueOrOverdueCount;
}
