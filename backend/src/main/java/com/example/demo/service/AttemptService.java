package com.example.demo.service;

import com.example.demo.dto.AttemptRequest;
import com.example.demo.dto.AttemptResponse;
import com.example.demo.model.Attempt;
import com.example.demo.model.MistakeTag;
import com.example.demo.model.Problem;
import com.example.demo.repository.AttemptRepository;
import com.example.demo.repository.MistakeTagRepository;
import com.example.demo.repository.ProblemRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttemptService {

    private final AttemptRepository attemptRepository;
    private final ProblemRepository problemRepository;
    private final UserRepository userRepository;
    private final MistakeTagRepository mistakeTagRepository;

    public List<AttemptResponse> getAttemptsForProblem(UUID problemId, UUID userId) {
        // Verify user owns problem
        problemRepository.findByIdAndUserId(problemId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem not found"));

        return attemptRepository.findByProblemIdAndUserIdOrderByAttemptedAtDesc(problemId, userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public AttemptResponse logAttempt(UUID problemId, AttemptRequest request, UUID userId) {
        Problem problem = problemRepository.findByIdAndUserId(problemId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem not found"));
        var user = userRepository.findById(userId).orElseThrow();

        Set<MistakeTag> mistakeTags = new HashSet<>();
        if (request.getMistakeTagIds() != null && !request.getMistakeTagIds().isEmpty()) {
            for (UUID mId : request.getMistakeTagIds()) {
                MistakeTag m = mistakeTagRepository.findByIdAndAvailableForUser(mId, userId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid mistake tag"));
                mistakeTags.add(m);
            }
        }

        Attempt attempt = Attempt.builder()
                .problem(problem)
                .user(user)
                .attemptedAt(request.getAttemptedAt() != null ? request.getAttemptedAt() : LocalDateTime.now())
                .result(request.getResult())
                .understood(request.isUnderstood())
                .logicFound(request.isLogicFound())
                .codeCompleted(request.isCodeCompleted())
                .timeTakenMin(request.getTimeTakenMin())
                .timeComplexity(request.getTimeComplexity())
                .spaceComplexity(request.getSpaceComplexity())
                .confidence(request.getConfidence())
                .approach(request.getApproach())
                .mistakes(request.getMistakes())
                .code(request.getCode())
                .language(request.getLanguage())
                .mistakeTags(mistakeTags)
                .build();

        attempt = attemptRepository.save(attempt);

        // F-20: Status and revision fields are recalculated
        updateProblemStatus(problem, attempt, request.getNextRevisitDate());

        return mapToResponse(attempt);
    }

    private void updateProblemStatus(Problem problem, Attempt latestAttempt, java.time.LocalDate nextRevisitDate) {
        problem.setCurrentStatus(latestAttempt.getResult());
        
        // F-24: Logging a successful revisit clears the next revisit date, unless user sets a new date
        if (nextRevisitDate != null) {
            problem.setNextRevisitDate(nextRevisitDate);
        } else if ("Solved".equals(latestAttempt.getResult()) || "Solved optimally".equals(latestAttempt.getResult())) {
            problem.setNextRevisitDate(null);
            problem.setLastSuccessfulAt(latestAttempt.getAttemptedAt());
        }

        problemRepository.save(problem);
    }

    private AttemptResponse mapToResponse(Attempt attempt) {
        return AttemptResponse.builder()
                .id(attempt.getId())
                .problemId(attempt.getProblem().getId())
                .attemptedAt(attempt.getAttemptedAt())
                .result(attempt.getResult())
                .understood(attempt.isUnderstood())
                .logicFound(attempt.isLogicFound())
                .codeCompleted(attempt.isCodeCompleted())
                .timeTakenMin(attempt.getTimeTakenMin())
                .timeComplexity(attempt.getTimeComplexity())
                .spaceComplexity(attempt.getSpaceComplexity())
                .confidence(attempt.getConfidence())
                .approach(attempt.getApproach())
                .mistakes(attempt.getMistakes())
                .code(attempt.getCode())
                .language(attempt.getLanguage())
                .mistakeTags(attempt.getMistakeTags().stream().map(MistakeTag::getName).collect(Collectors.toSet()))
                .build();
    }
}
