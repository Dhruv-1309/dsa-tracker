package com.example.demo.service;

import com.example.demo.dto.*;
import com.example.demo.model.ConnectionStatus;
import com.example.demo.model.FriendConnection;
import com.example.demo.model.Problem;
import com.example.demo.model.User;
import com.example.demo.repository.FriendConnectionRepository;
import com.example.demo.repository.ProblemRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FriendService {

    private static final String FRIEND_CODE_CHARACTERS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
    private static final int CODE_LENGTH = 10;
    private final SecureRandom secureRandom = new SecureRandom();

    private final UserRepository userRepository;
    private final FriendConnectionRepository friendConnectionRepository;
    private final ProblemRepository problemRepository;
    private final StatsService statsService;

    @Transactional
    public FriendCodeResponse getOrCreateFriendCode(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getFriendCode() == null || user.getFriendCode().trim().isEmpty()) {
            String newCode = generateUniqueFriendCode();
            user.setFriendCode(newCode);
            userRepository.save(user);
        }

        return FriendCodeResponse.of(user.getFriendCode());
    }

    @Transactional
    public FriendCodeResponse regenerateFriendCode(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        String currentCode = user.getFriendCode();
        String newCode = generateUniqueFriendCode();
        while (newCode.equals(currentCode)) {
            newCode = generateUniqueFriendCode();
        }

        user.setFriendCode(newCode);
        userRepository.save(user);

        return FriendCodeResponse.of(newCode);
    }

    @Transactional
    public FriendRequestActionResponse sendFriendRequest(UUID callerId, String rawCode) {
        if (rawCode == null || rawCode.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Friend code cannot be empty");
        }

        String code = rawCode.trim().toUpperCase();
        User targetUser = userRepository.findByFriendCode(code)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with provided friend code"));

        if (targetUser.getId().equals(callerId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot send friend request to yourself");
        }

        User caller = userRepository.findById(callerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Caller user not found"));

        // Order pair canonically so user_a_id < user_b_id
        User userA = caller.getId().compareTo(targetUser.getId()) < 0 ? caller : targetUser;
        User userB = caller.getId().compareTo(targetUser.getId()) < 0 ? targetUser : caller;

        Optional<FriendConnection> existingConnOpt = friendConnectionRepository.findByUserAAndUserB(userA, userB);

        if (existingConnOpt.isPresent()) {
            FriendConnection existing = existingConnOpt.get();

            if (existing.getStatus() == ConnectionStatus.ACCEPTED) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Already friends");
            }

            if (existing.getStatus() == ConnectionStatus.PENDING) {
                if (existing.getRequestedBy().getId().equals(callerId)) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Friend request already sent");
                } else {
                    // Reciprocal request: auto-accept
                    existing.setStatus(ConnectionStatus.ACCEPTED);
                    existing.setRespondedAt(LocalDateTime.now());
                    friendConnectionRepository.save(existing);

                    return FriendRequestActionResponse.builder()
                            .message("Friend request accepted")
                            .status("ACCEPTED")
                            .build();
                }
            }
        }

        FriendConnection newConnection = FriendConnection.builder()
                .userA(userA)
                .userB(userB)
                .requestedBy(caller)
                .status(ConnectionStatus.PENDING)
                .build();

        friendConnectionRepository.save(newConnection);

        return FriendRequestActionResponse.builder()
                .message("Friend request sent")
                .status("PENDING")
                .build();
    }

    @Transactional(readOnly = true)
    public List<IncomingFriendRequestResponse> getIncomingPendingRequests(UUID callerId) {
        User caller = userRepository.findById(callerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        List<FriendConnection> pending = friendConnectionRepository.findIncomingPendingRequests(caller);

        return pending.stream().map(conn -> {
            User requester = conn.getRequestedBy();
            String name = (requester.getDisplayName() != null && !requester.getDisplayName().isBlank())
                    ? requester.getDisplayName()
                    : (requester.getEmail() != null && requester.getEmail().contains("@")
                        ? requester.getEmail().substring(0, requester.getEmail().indexOf('@'))
                        : "Coder");

            return IncomingFriendRequestResponse.builder()
                    .id(conn.getId())
                    .requesterId(requester.getId())
                    .requesterName(name)
                    .requesterEmail(requester.getEmail())
                    .createdAt(conn.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public FriendRequestActionResponse acceptFriendRequest(UUID callerId, UUID requestId) {
        FriendConnection conn = friendConnectionRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Friend request not found"));

        boolean isCallerParty = conn.getUserA().getId().equals(callerId) || conn.getUserB().getId().equals(callerId);
        boolean isCallerRequester = conn.getRequestedBy().getId().equals(callerId);

        if (!isCallerParty || isCallerRequester) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the recipient can accept this request");
        }

        if (conn.getStatus() == ConnectionStatus.ACCEPTED) {
            return FriendRequestActionResponse.builder()
                    .message("Already accepted")
                    .status("ACCEPTED")
                    .build();
        }

        conn.setStatus(ConnectionStatus.ACCEPTED);
        conn.setRespondedAt(LocalDateTime.now());
        friendConnectionRepository.save(conn);

        return FriendRequestActionResponse.builder()
                .message("Friend request accepted")
                .status("ACCEPTED")
                .build();
    }

    @Transactional
    public void declineFriendRequest(UUID callerId, UUID requestId) {
        FriendConnection conn = friendConnectionRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Friend request not found"));

        boolean isCallerParty = conn.getUserA().getId().equals(callerId) || conn.getUserB().getId().equals(callerId);
        boolean isCallerRequester = conn.getRequestedBy().getId().equals(callerId);

        if (!isCallerParty || isCallerRequester) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the recipient can decline this request");
        }

        friendConnectionRepository.delete(conn);
    }

    @Transactional(readOnly = true)
    public List<FriendResponse> getAcceptedFriends(UUID callerId) {
        User caller = userRepository.findById(callerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        List<FriendConnection> connections = friendConnectionRepository.findAcceptedConnections(caller);

        return connections.stream().map(conn -> {
            User friend = conn.getUserA().getId().equals(callerId) ? conn.getUserB() : conn.getUserA();
            String name = (friend.getDisplayName() != null && !friend.getDisplayName().isBlank())
                    ? friend.getDisplayName()
                    : (friend.getEmail() != null && friend.getEmail().contains("@")
                        ? friend.getEmail().substring(0, friend.getEmail().indexOf('@'))
                        : "Coder");

            return FriendResponse.builder()
                    .id(conn.getId())
                    .friendUserId(friend.getId())
                    .displayName(name)
                    .email(friend.getEmail())
                    .respondedAt(conn.getRespondedAt() != null ? conn.getRespondedAt() : conn.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public void removeFriend(UUID callerId, UUID friendUserId) {
        User caller = userRepository.findById(callerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Caller not found"));
        User friend = userRepository.findById(friendUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Friend not found"));

        User userA = caller.getId().compareTo(friend.getId()) < 0 ? caller : friend;
        User userB = caller.getId().compareTo(friend.getId()) < 0 ? friend : caller;

        FriendConnection conn = friendConnectionRepository.findByUserAAndUserB(userA, userB)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Friend connection not found"));

        if (conn.getStatus() != ConnectionStatus.ACCEPTED) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Friend connection not found");
        }

        friendConnectionRepository.delete(conn);
    }

    @Transactional(readOnly = true)
    public FriendSummaryResponse getFriendSummary(UUID callerId, UUID friendUserId, Integer year) {
        User caller = userRepository.findById(callerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Caller not found"));
        User friend = userRepository.findById(friendUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Friend user not found"));

        // CORE AUTHORIZATION POINT:
        // Must have an ACCEPTED friend connection between caller and friendUserId
        Optional<FriendConnection> acceptedConn = friendConnectionRepository.findAcceptedConnectionBetweenUsers(caller, friend);
        if (acceptedConn.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: You are not accepted friends with this user");
        }

        // Solved problems (filtered strictly to SOLVED / SOLVED_OPTIMALLY, no attempt details)
        List<Problem> problems = problemRepository.findByUserIdWithTopics(friendUserId);
        List<FriendSummaryProblemDto> solvedProblems = problems.stream()
                .filter(p -> isSolvedStatus(p.getCurrentStatus()))
                .sorted(Comparator.comparing(Problem::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(p -> FriendSummaryProblemDto.builder()
                        .id(p.getId())
                        .title(p.getTitle())
                        .platform(p.getPlatform())
                        .difficulty(p.getDifficulty())
                        .primaryTopicName(p.getPrimaryTopic() != null ? p.getPrimaryTopic().getName() : "General")
                        .url(p.getUrl())
                        .currentStatus(p.getCurrentStatus())
                        .build())
                .collect(Collectors.toList());

        // Heatmap counts per day
        int targetYear = (year != null && year > 0) ? year : LocalDate.now().getYear();
        List<HeatmapEntry> heatmap = statsService.getHeatmap(friendUserId, targetYear);

        String displayName = (friend.getDisplayName() != null && !friend.getDisplayName().isBlank())
                ? friend.getDisplayName()
                : (friend.getEmail() != null && friend.getEmail().contains("@")
                    ? friend.getEmail().substring(0, friend.getEmail().indexOf('@'))
                    : "Coder");

        return FriendSummaryResponse.builder()
                .friendUserId(friendUserId)
                .displayName(displayName)
                .email(friend.getEmail())
                .solvedProblems(solvedProblems)
                .heatmap(heatmap)
                .build();
    }

    private boolean isSolvedStatus(String status) {
        if (status == null) return false;
        String s = status.trim().toUpperCase().replace(" ", "_");
        return "SOLVED".equals(s) || "SOLVED_OPTIMALLY".equals(s);
    }

    private String generateUniqueFriendCode() {
        for (int attempts = 0; attempts < 30; attempts++) {
            StringBuilder sb = new StringBuilder(CODE_LENGTH);
            for (int i = 0; i < CODE_LENGTH; i++) {
                int idx = secureRandom.nextInt(FRIEND_CODE_CHARACTERS.length());
                sb.append(FRIEND_CODE_CHARACTERS.charAt(idx));
            }
            String candidate = sb.toString();
            if (!userRepository.existsByFriendCode(candidate)) {
                return candidate;
            }
        }
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to generate unique friend code");
    }
}
