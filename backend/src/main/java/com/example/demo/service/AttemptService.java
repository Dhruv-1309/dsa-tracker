package com.example.demo.service;

import com.example.demo.dto.AttemptRequest;
import com.example.demo.dto.AttemptResponse;
import com.example.demo.model.Attempt;
import com.example.demo.model.Problem;
import com.example.demo.repository.AttemptRepository;
import com.example.demo.repository.ProblemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttemptService {

    private final AttemptRepository attemptRepository;
    private final ProblemRepository problemRepository;

    @Transactional
    public AttemptResponse createAttempt(UUID problemId, AttemptRequest request, UUID userId) {
        Problem problem = problemRepository.findByIdAndUserId(problemId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem not found"));

        Attempt attempt = Attempt.builder()
                .problem(problem)
                .date(request.getDate())
                .thinkingResult(request.getThinkingResult())
                .codingResult(request.getCodingResult())
                .timeComplexity(request.getTimeComplexity())
                .spaceComplexity(request.getSpaceComplexity())
                .confidence(request.getConfidence())
                .notes(request.getNotes())
                .nextRevisitDate(request.getNextRevisitDate())
                .build();

        attempt = attemptRepository.save(attempt);

        // Update Problem fields based on the new Attempt
        problem.setConfidence(request.getConfidence());
        problem.setNextRevisitDate(request.getNextRevisitDate());
        problem.setTotalAttempts(problem.getTotalAttempts() + 1);

        String newStatus = determineStatus(request.getThinkingResult(), request.getCodingResult());
        if (newStatus != null) {
            problem.setStatus(newStatus);
            if ("Solved".equals(newStatus) || "Solved Optimally".equals(newStatus)) {
                problem.setTimesSolved(problem.getTimesSolved() + 1);
            }
        }

        problemRepository.save(problem);

        return mapToResponse(attempt);
    }

    public List<AttemptResponse> getAttempts(UUID problemId, UUID userId) {
        // Enforce ownership
        if (problemRepository.findByIdAndUserId(problemId, userId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem not found");
        }

        return attemptRepository.findByProblemIdOrderByCreatedAtDesc(problemId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private String determineStatus(String thinkingResult, String codingResult) {
        if ("Implemented Optimally".equals(codingResult)) {
            return "Solved Optimally";
        }
        if ("Implemented Suboptimally".equals(codingResult)) {
            return "Solved";
        }
        if ("Attempted, Could Not Finish".equals(codingResult)) {
            return "Code Done";
        }
        if ("N/A".equals(codingResult) || codingResult == null) {
            if ("Could Not Find Logic".equals(thinkingResult)) {
                return "Tried";
            }
            if (thinkingResult != null && thinkingResult.contains("Found Logic")) {
                return "Logic Done";
            }
        }
        return null; // Fallback, leaves status unchanged if it doesn't match rules
    }

    private AttemptResponse mapToResponse(Attempt attempt) {
        return AttemptResponse.builder()
                .id(attempt.getId())
                .problemId(attempt.getProblem().getId())
                .date(attempt.getDate())
                .thinkingResult(attempt.getThinkingResult())
                .codingResult(attempt.getCodingResult())
                .timeComplexity(attempt.getTimeComplexity())
                .spaceComplexity(attempt.getSpaceComplexity())
                .confidence(attempt.getConfidence())
                .notes(attempt.getNotes())
                .nextRevisitDate(attempt.getNextRevisitDate())
                .createdAt(attempt.getCreatedAt())
                .build();
    }
}
