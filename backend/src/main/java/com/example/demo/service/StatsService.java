package com.example.demo.service;

import com.example.demo.dto.HeatmapEntry;
import com.example.demo.dto.MistakeFrequencyResponse;
import com.example.demo.dto.StatsSummaryResponse;
import com.example.demo.dto.TopicProgressResponse;
import com.example.demo.model.Difficulty;
import com.example.demo.model.Problem;
import com.example.demo.model.Topic;
import com.example.demo.repository.AttemptRepository;
import com.example.demo.repository.ProblemRepository;
import com.example.demo.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final ProblemRepository problemRepository;
    private final AttemptRepository attemptRepository;
    private final TopicRepository topicRepository;

    public StatsSummaryResponse getSummary(UUID userId) {
        Map<String, Long> statusCounts = problemRepository.countByStatusForUser(userId).stream()
                .collect(Collectors.toMap(
                        row -> row[0] != null ? (String) row[0] : "Not Attempted",
                        row -> (Long) row[1]
                ));

        Map<String, Long> difficultyCounts = problemRepository.countByDifficultyForUser(userId).stream()
                .collect(Collectors.toMap(
                        row -> row[0] != null ? ((Difficulty) row[0]).name() : "Unknown",
                        row -> (Long) row[1]
                ));

        Map<String, Long> platformCounts = problemRepository.countByPlatformForUser(userId).stream()
                .collect(Collectors.toMap(
                        row -> row[0] != null ? (String) row[0] : "Other",
                        row -> (Long) row[1]
                ));

        long totalProblems = problemRepository.countByUserId(userId);
        long dueOrOverdueCount = problemRepository.countDueOrOverdueForUser(userId, LocalDate.now());

        return StatsSummaryResponse.builder()
                .statusCounts(statusCounts)
                .difficultyCounts(difficultyCounts)
                .platformCounts(platformCounts)
                .totalProblems(totalProblems)
                .dueOrOverdueCount(dueOrOverdueCount)
                .build();
    }

    public List<HeatmapEntry> getHeatmap(UUID userId, int year) {
        return attemptRepository.countAttemptsByDateForUserAndYear(userId, year).stream()
                .map(row -> HeatmapEntry.builder()
                        .date(((Date) row[0]).toLocalDate())
                        .count(((Number) row[1]).longValue())
                        .build())
                .collect(Collectors.toList());
    }

    public List<TopicProgressResponse> getTopicsProgress(UUID userId) {
        List<Problem> problems = problemRepository.findByUserId(userId);
        List<Topic> availableTopics = topicRepository.findAllAvailableForUser(userId);

        Map<UUID, TopicProgressResponse.TopicProgressResponseBuilder> topicBuilders = new HashMap<>();
        for (Topic t : availableTopics) {
            topicBuilders.put(t.getId(), TopicProgressResponse.builder()
                    .topicId(t.getId())
                    .topicName(t.getName())
                    .totalProblems(0)
                    .solvedProblems(0));
        }

        for (Problem p : problems) {
            Set<UUID> topicIds = new HashSet<>();
            topicIds.add(p.getPrimaryTopic().getId());
            p.getExtraTopics().forEach(t -> topicIds.add(t.getId()));

            boolean isSolved = "Solved".equals(p.getCurrentStatus()) || "Solved optimally".equals(p.getCurrentStatus());

            for (UUID tId : topicIds) {
                var builder = topicBuilders.get(tId);
                if (builder != null) {
                    builder.totalProblems(builder.build().getTotalProblems() + 1);
                    if (isSolved) {
                        builder.solvedProblems(builder.build().getSolvedProblems() + 1);
                    }
                }
            }
        }

        return topicBuilders.values().stream()
                .map(TopicProgressResponse.TopicProgressResponseBuilder::build)
                // Filter out empty topics or just return them
                // F-30 says "counting only topics with at least 3 problems" for weak topics, 
                // but this endpoint can just return all populated topics.
                .filter(t -> t.getTotalProblems() > 0)
                .sorted((a, b) -> Long.compare(b.getTotalProblems(), a.getTotalProblems()))
                .collect(Collectors.toList());
    }

    public List<MistakeFrequencyResponse> getMistakeFrequencies(UUID userId) {
        return attemptRepository.countMistakeTagsForUser(userId).stream()
                .map(row -> MistakeFrequencyResponse.builder()
                        .mistakeTagName((String) row[0])
                        .count(((Number) row[1]).longValue())
                        .build())
                .collect(Collectors.toList());
    }
}
