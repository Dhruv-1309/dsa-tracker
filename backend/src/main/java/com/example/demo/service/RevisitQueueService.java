package com.example.demo.service;

import com.example.demo.dto.ProblemResponse;
import com.example.demo.model.Problem;
import com.example.demo.model.Topic;
import com.example.demo.repository.ProblemRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RevisitQueueService {

    private final ProblemRepository problemRepository;

    public List<ProblemResponse> getQueue(UUID userId, String bucket) {
        LocalDate today = LocalDate.now();

        Specification<Problem> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("user").get("id"), userId));

            // F-21: A problem is on the revision list once it has at least one successful attempt.
            // A successful attempt implies lastSuccessfulAt is not null.
            predicates.add(cb.isNotNull(root.get("lastSuccessfulAt")));

            if ("due".equalsIgnoreCase(bucket)) {
                predicates.add(cb.equal(root.get("nextRevisitDate"), today));
            } else if ("overdue".equalsIgnoreCase(bucket)) {
                predicates.add(cb.lessThan(root.get("nextRevisitDate"), today));
            } else if ("upcoming".equalsIgnoreCase(bucket)) {
                predicates.add(cb.greaterThan(root.get("nextRevisitDate"), today));
            } else if ("unscheduled".equalsIgnoreCase(bucket)) {
                predicates.add(cb.isNull(root.get("nextRevisitDate")));
            } else {
                throw new IllegalArgumentException("Invalid bucket: " + bucket);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Sort sort;
        if ("unscheduled".equalsIgnoreCase(bucket)) {
            // F-22: Sort by the date of the most recent successful attempt, oldest first.
            sort = Sort.by(Sort.Direction.ASC, "lastSuccessfulAt"); 
        } else {
            sort = Sort.by(Sort.Direction.ASC, "nextRevisitDate");
        }

        return problemRepository.findAll(spec, sort)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private ProblemResponse mapToResponse(Problem problem) {
        return ProblemResponse.builder()
                .id(problem.getId())
                .title(problem.getTitle())
                .platform(problem.getPlatform())
                .url(problem.getUrl())
                .difficulty(problem.getDifficulty())
                .primaryTopicId(problem.getPrimaryTopic().getId())
                .primaryTopicName(problem.getPrimaryTopic().getName())
                .extraTopicNames(problem.getExtraTopics().stream().map(Topic::getName).collect(Collectors.toSet()))
                .optimalTime(problem.getOptimalTime())
                .optimalSpace(problem.getOptimalSpace())
                .currentStatus(problem.getCurrentStatus())
                .lastSuccessfulAt(problem.getLastSuccessfulAt())
                .nextRevisitDate(problem.getNextRevisitDate())
                .createdAt(problem.getCreatedAt())
                .updatedAt(problem.getUpdatedAt())
                .build();
    }
}
