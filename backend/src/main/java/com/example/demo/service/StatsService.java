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
                .map(row -> {
                    LocalDate d;
                    if (row[0] instanceof LocalDate) {
                        d = (LocalDate) row[0];
                    } else if (row[0] instanceof Date) {
                        d = ((Date) row[0]).toLocalDate();
                    } else {
                        d = LocalDate.parse(row[0].toString());
                    }
                    return HeatmapEntry.builder()
                            .date(d)
                            .count(((Number) row[1]).longValue())
                            .build();
                })
                .collect(Collectors.toList());
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<TopicProgressResponse> getTopicsProgress(UUID userId) {
        List<Problem> problems = problemRepository.findByUserIdWithTopics(userId);
        List<Topic> availableTopics = topicRepository.findAllAvailableForUser(userId);

        Map<UUID, int[]> countsMap = new HashMap<>(availableTopics.size());
        for (Topic t : availableTopics) {
            countsMap.put(t.getId(), new int[2]); // index 0: total, index 1: solved
        }

        for (Problem p : problems) {
            Set<UUID> topicIds = new HashSet<>();
            if (p.getPrimaryTopic() != null) {
                topicIds.add(p.getPrimaryTopic().getId());
            }
            if (p.getExtraTopics() != null) {
                for (Topic et : p.getExtraTopics()) {
                    topicIds.add(et.getId());
                }
            }

            boolean isSolved = "Solved".equals(p.getCurrentStatus()) || "Solved optimally".equals(p.getCurrentStatus());

            for (UUID tId : topicIds) {
                int[] counts = countsMap.get(tId);
                if (counts != null) {
                    counts[0]++;
                    if (isSolved) {
                        counts[1]++;
                    }
                }
            }
        }

        return availableTopics.stream()
                .map(t -> {
                    int[] counts = countsMap.get(t.getId());
                    int total = counts != null ? counts[0] : 0;
                    int solved = counts != null ? counts[1] : 0;
                    return TopicProgressResponse.builder()
                            .topicId(t.getId())
                            .topicName(t.getName())
                            .totalProblems(total)
                            .solvedProblems(solved)
                            .build();
                })
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
