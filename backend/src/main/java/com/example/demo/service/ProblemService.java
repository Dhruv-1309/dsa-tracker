package com.example.demo.service;

import com.example.demo.dto.ProblemRequest;
import com.example.demo.dto.ProblemResponse;
import com.example.demo.model.Problem;
import com.example.demo.repository.ProblemRepository;
import com.example.demo.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProblemService {

    private final ProblemRepository problemRepository;
    private final UserRepository userRepository;

    public List<ProblemResponse> getProblems(UUID userId, String search, String topic, String status, Sort sort) {
        Specification<Problem> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("user").get("id"), userId));

            if (search != null && !search.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("name")), "%" + search.toLowerCase() + "%"));
            }
            if (topic != null && !topic.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("topic"), topic));
            }
            if (status != null && !status.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return problemRepository.findAll(spec, sort)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ProblemResponse getProblemById(UUID id, UUID userId) {
        Problem problem = problemRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem not found"));
        return mapToResponse(problem);
    }

    @Transactional
    public ProblemResponse createProblem(ProblemRequest request, UUID userId) {
        var user = userRepository.findById(userId).orElseThrow();
        Problem problem = Problem.builder()
                .user(user)
                .name(request.getName())
                .topic(request.getTopic())
                .link(request.getLink())
                .difficulty(request.getDifficulty())
                .approachNotes(request.getApproachNotes())
                .status(request.getStatus() != null ? request.getStatus() : "Not Attempted")
                .confidence(request.getConfidence())
                .build();
        
        problem = problemRepository.save(problem);
        return mapToResponse(problem);
    }

    @Transactional
    public ProblemResponse updateProblem(UUID id, ProblemRequest request, UUID userId) {
        Problem problem = problemRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem not found"));

        problem.setName(request.getName());
        problem.setTopic(request.getTopic());
        problem.setLink(request.getLink());
        problem.setDifficulty(request.getDifficulty());
        problem.setApproachNotes(request.getApproachNotes());
        if (request.getStatus() != null) {
            problem.setStatus(request.getStatus());
        }
        problem.setConfidence(request.getConfidence());

        problem = problemRepository.save(problem);
        return mapToResponse(problem);
    }

    @Transactional
    public void deleteProblem(UUID id, UUID userId) {
        if (!problemRepository.findByIdAndUserId(id, userId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem not found");
        }
        problemRepository.deleteByIdAndUserId(id, userId);
    }

    private ProblemResponse mapToResponse(Problem problem) {
        return ProblemResponse.builder()
                .id(problem.getId())
                .name(problem.getName())
                .topic(problem.getTopic())
                .link(problem.getLink())
                .difficulty(problem.getDifficulty())
                .approachNotes(problem.getApproachNotes())
                .status(problem.getStatus())
                .confidence(problem.getConfidence())
                .nextRevisitDate(problem.getNextRevisitDate())
                .totalAttempts(problem.getTotalAttempts())
                .timesSolved(problem.getTimesSolved())
                .createdAt(problem.getCreatedAt())
                .updatedAt(problem.getUpdatedAt())
                .build();
    }
}
