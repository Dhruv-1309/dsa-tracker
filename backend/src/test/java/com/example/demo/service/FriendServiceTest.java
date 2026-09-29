package com.example.demo.service;

import com.example.demo.dto.*;
import com.example.demo.model.*;
import com.example.demo.repository.AttemptRepository;
import com.example.demo.repository.FriendConnectionRepository;
import com.example.demo.repository.ProblemRepository;
import com.example.demo.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FriendServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private FriendConnectionRepository friendConnectionRepository;

    @Mock
    private ProblemRepository problemRepository;

    @Mock
    private AttemptRepository attemptRepository;

    @Mock
    private StatsService statsService;

    @InjectMocks
    private FriendService friendService;

    private User userA;
    private User userB;
    private UUID userAId;
    private UUID userBId;

    @BeforeEach
    void setUp() {
        // Guarantee userAId < userBId for predictable testing
        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();
        if (id1.compareTo(id2) > 0) {
            UUID tmp = id1;
            id1 = id2;
            id2 = tmp;
        }
        userAId = id1;
        userBId = id2;

        userA = User.builder()
                .id(userAId)
                .email("alice@example.com")
                .displayName("Alice")
                .friendCode("ALICE12345")
                .build();

        userB = User.builder()
                .id(userBId)
                .email("bob@example.com")
                .displayName("Bob")
                .friendCode("BOB1234567")
                .build();
    }

    @Test
    @DisplayName("GET /friends/{friendUserId}/summary returns 403 when no connection exists")
    void getFriendSummary_noConnection_returns403() {
        when(userRepository.findById(userAId)).thenReturn(Optional.of(userA));
        when(userRepository.findById(userBId)).thenReturn(Optional.of(userB));
        when(friendConnectionRepository.findAcceptedConnectionBetweenUsers(userA, userB))
                .thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                friendService.getFriendSummary(userAId, userBId, null)
        );

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Access denied"));
    }

    @Test
    @DisplayName("GET /friends/{friendUserId}/summary returns 403 when only PENDING request exists")
    void getFriendSummary_pendingConnection_returns403() {
        when(userRepository.findById(userAId)).thenReturn(Optional.of(userA));
        when(userRepository.findById(userBId)).thenReturn(Optional.of(userB));
        // Only accepted connection query is used for summary authorization
        when(friendConnectionRepository.findAcceptedConnectionBetweenUsers(userA, userB))
                .thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                friendService.getFriendSummary(userAId, userBId, null)
        );

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    @DisplayName("GET /friends/{friendUserId}/summary returns solved problems and heatmap when ACCEPTED")
    void getFriendSummary_accepted_returnsSummary() {
        FriendConnection connection = FriendConnection.builder()
                .id(UUID.randomUUID())
                .userA(userA)
                .userB(userB)
                .requestedBy(userA)
                .status(ConnectionStatus.ACCEPTED)
                .respondedAt(LocalDateTime.now())
                .build();

        when(userRepository.findById(userAId)).thenReturn(Optional.of(userA));
        when(userRepository.findById(userBId)).thenReturn(Optional.of(userB));
        when(friendConnectionRepository.findAcceptedConnectionBetweenUsers(userA, userB))
                .thenReturn(Optional.of(connection));

        Topic dpTopic = Topic.builder().id(UUID.randomUUID()).name("Dynamic Programming").build();
        Problem solvedProblem = Problem.builder()
                .id(UUID.randomUUID())
                .title("Climbing Stairs")
                .platform("LeetCode")
                .difficulty(Difficulty.EASY)
                .currentStatus("Solved")
                .primaryTopic(dpTopic)
                .extraTopics(new HashSet<>())
                .createdAt(LocalDateTime.now())
                .build();

        Problem unsolvedProblem = Problem.builder()
                .id(UUID.randomUUID())
                .title("Hard Problem")
                .platform("LeetCode")
                .difficulty(Difficulty.HARD)
                .currentStatus("Tried")
                .primaryTopic(dpTopic)
                .extraTopics(new HashSet<>())
                .createdAt(LocalDateTime.now())
                .build();

        when(problemRepository.findByUserIdWithTopics(userBId))
                .thenReturn(List.of(solvedProblem, unsolvedProblem));

        List<HeatmapEntry> mockHeatmap = List.of(HeatmapEntry.builder().date(LocalDate.now()).count(3).build());
        when(statsService.getHeatmap(eq(userBId), anyInt())).thenReturn(mockHeatmap);

        FriendSummaryResponse response = friendService.getFriendSummary(userAId, userBId, 2026);

        assertNotNull(response);
        assertEquals(userBId, response.getFriendUserId());
        assertEquals("Bob", response.getDisplayName());
        // All problems (solved + tried) returned in both problems and solvedProblems
        assertEquals(2, response.getProblems().size());
        assertEquals(2, response.getSolvedProblems().size());
        assertEquals(1, response.getHeatmap().size());
    }

    @Test
    @DisplayName("GET /friends/{friendUserId}/problems/{problemId} returns 403 when no connection exists")
    void getFriendProblemDetail_noConnection_returns403() {
        UUID problemId = UUID.randomUUID();
        when(userRepository.findById(userAId)).thenReturn(Optional.of(userA));
        when(userRepository.findById(userBId)).thenReturn(Optional.of(userB));
        when(friendConnectionRepository.findAcceptedConnectionBetweenUsers(userA, userB))
                .thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                friendService.getFriendProblemDetail(userAId, userBId, problemId)
        );

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Access denied"));
    }

    @Test
    @DisplayName("GET /friends/{friendUserId}/problems/{problemId} returns 403 when only PENDING connection exists")
    void getFriendProblemDetail_pendingConnection_returns403() {
        UUID problemId = UUID.randomUUID();
        when(userRepository.findById(userAId)).thenReturn(Optional.of(userA));
        when(userRepository.findById(userBId)).thenReturn(Optional.of(userB));
        when(friendConnectionRepository.findAcceptedConnectionBetweenUsers(userA, userB))
                .thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                friendService.getFriendProblemDetail(userAId, userBId, problemId)
        );

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    @DisplayName("GET /friends/{friendUserId}/problems/{problemId} returns 404 when problem does not exist")
    void getFriendProblemDetail_problemNotFound_returns404() {
        UUID problemId = UUID.randomUUID();
        FriendConnection connection = FriendConnection.builder()
                .id(UUID.randomUUID())
                .userA(userA)
                .userB(userB)
                .status(ConnectionStatus.ACCEPTED)
                .build();

        when(userRepository.findById(userAId)).thenReturn(Optional.of(userA));
        when(userRepository.findById(userBId)).thenReturn(Optional.of(userB));
        when(friendConnectionRepository.findAcceptedConnectionBetweenUsers(userA, userB))
                .thenReturn(Optional.of(connection));
        when(problemRepository.findById(problemId)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                friendService.getFriendProblemDetail(userAId, userBId, problemId)
        );

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    @DisplayName("GET /friends/{friendUserId}/problems/{problemId} returns 404 when problem belongs to another user")
    void getFriendProblemDetail_wrongOwner_returns404() {
        UUID problemId = UUID.randomUUID();
        FriendConnection connection = FriendConnection.builder()
                .id(UUID.randomUUID())
                .userA(userA)
                .userB(userB)
                .status(ConnectionStatus.ACCEPTED)
                .build();

        User thirdParty = User.builder().id(UUID.randomUUID()).email("charlie@example.com").build();
        Problem problem = Problem.builder()
                .id(problemId)
                .user(thirdParty)
                .title("Foreign Problem")
                .build();

        when(userRepository.findById(userAId)).thenReturn(Optional.of(userA));
        when(userRepository.findById(userBId)).thenReturn(Optional.of(userB));
        when(friendConnectionRepository.findAcceptedConnectionBetweenUsers(userA, userB))
                .thenReturn(Optional.of(connection));
        when(problemRepository.findById(problemId)).thenReturn(Optional.of(problem));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                friendService.getFriendProblemDetail(userAId, userBId, problemId)
        );

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
        assertTrue(ex.getReason().contains("does not belong to friend"));
    }

    @Test
    @DisplayName("GET /friends/{friendUserId}/problems/{problemId} returns empty attempts array when 0 attempts")
    void getFriendProblemDetail_zeroAttempts_returnsEmptyList() {
        UUID problemId = UUID.randomUUID();
        FriendConnection connection = FriendConnection.builder()
                .id(UUID.randomUUID())
                .userA(userA)
                .userB(userB)
                .status(ConnectionStatus.ACCEPTED)
                .build();

        Problem problem = Problem.builder()
                .id(problemId)
                .user(userB)
                .title("Two Sum")
                .platform("LeetCode")
                .difficulty(Difficulty.EASY)
                .currentStatus("Tried")
                .createdAt(LocalDateTime.now())
                .build();

        when(userRepository.findById(userAId)).thenReturn(Optional.of(userA));
        when(userRepository.findById(userBId)).thenReturn(Optional.of(userB));
        when(friendConnectionRepository.findAcceptedConnectionBetweenUsers(userA, userB))
                .thenReturn(Optional.of(connection));
        when(problemRepository.findById(problemId)).thenReturn(Optional.of(problem));
        when(attemptRepository.findByProblemIdAndUserIdOrderByAttemptedAtDesc(problemId, userBId))
                .thenReturn(Collections.emptyList());

        FriendProblemDetailResponse detail = friendService.getFriendProblemDetail(userAId, userBId, problemId);

        assertNotNull(detail);
        assertEquals(problemId, detail.getId());
        assertEquals("Two Sum", detail.getTitle());
        assertNotNull(detail.getAttempts());
        assertTrue(detail.getAttempts().isEmpty());
    }

    @Test
    @DisplayName("GET /friends/{friendUserId}/problems/{problemId} returns full attempts timeline with details")
    void getFriendProblemDetail_withAttempts_returnsTimeline() {
        UUID problemId = UUID.randomUUID();
        FriendConnection connection = FriendConnection.builder()
                .id(UUID.randomUUID())
                .userA(userA)
                .userB(userB)
                .status(ConnectionStatus.ACCEPTED)
                .build();

        Topic topic = Topic.builder().id(UUID.randomUUID()).name("Arrays").build();
        Problem problem = Problem.builder()
                .id(problemId)
                .user(userB)
                .title("Two Sum")
                .platform("LeetCode")
                .difficulty(Difficulty.EASY)
                .primaryTopic(topic)
                .extraTopics(new HashSet<>())
                .currentStatus("Solved")
                .createdAt(LocalDateTime.now())
                .build();

        MistakeTag tag = MistakeTag.builder().id(UUID.randomUUID()).name("Off-by-one").build();
        Attempt attempt = Attempt.builder()
                .id(UUID.randomUUID())
                .problem(problem)
                .user(userB)
                .attemptedAt(LocalDateTime.now())
                .result("Solved")
                .understood(true)
                .logicFound(true)
                .codeCompleted(true)
                .timeTakenMin(25)
                .timeComplexity("O(n)")
                .spaceComplexity("O(n)")
                .confidence(5)
                .approach("Used hash map for complements")
                .mistakes("Initially forgot zero index")
                .code("def twoSum(nums, target): return {}")
                .language("Python")
                .mistakeTags(Set.of(tag))
                .build();

        when(userRepository.findById(userAId)).thenReturn(Optional.of(userA));
        when(userRepository.findById(userBId)).thenReturn(Optional.of(userB));
        when(friendConnectionRepository.findAcceptedConnectionBetweenUsers(userA, userB))
                .thenReturn(Optional.of(connection));
        when(problemRepository.findById(problemId)).thenReturn(Optional.of(problem));
        when(attemptRepository.findByProblemIdAndUserIdOrderByAttemptedAtDesc(problemId, userBId))
                .thenReturn(List.of(attempt));

        FriendProblemDetailResponse detail = friendService.getFriendProblemDetail(userAId, userBId, problemId);

        assertNotNull(detail);
        assertEquals(problemId, detail.getId());
        assertEquals(1, detail.getAttempts().size());

        AttemptResponse aRes = detail.getAttempts().get(0);
        assertEquals("Solved", aRes.getResult());
        assertEquals("Used hash map for complements", aRes.getApproach());
        assertEquals("Initially forgot zero index", aRes.getMistakes());
        assertEquals("def twoSum(nums, target): return {}", aRes.getCode());
        assertEquals(5, aRes.getConfidence());
        assertEquals(25, aRes.getTimeTakenMin());
        assertTrue(aRes.getMistakeTags().contains("Off-by-one"));
    }

    @Test
    @DisplayName("Sending a request when other person already sent one auto-accepts instead of duplicate row")
    void sendFriendRequest_autoAcceptsReciprocalRequest() {
        // Bob already sent a request to Alice
        FriendConnection pendingFromBob = FriendConnection.builder()
                .id(UUID.randomUUID())
                .userA(userA)
                .userB(userB)
                .requestedBy(userB)
                .status(ConnectionStatus.PENDING)
                .createdAt(LocalDateTime.now().minusHours(1))
                .build();

        when(userRepository.findByFriendCode("BOB1234567")).thenReturn(Optional.of(userB));
        when(userRepository.findById(userAId)).thenReturn(Optional.of(userA));
        when(friendConnectionRepository.findByUserAAndUserB(userA, userB)).thenReturn(Optional.of(pendingFromBob));

        // Alice sends request to Bob using Bob's code
        FriendRequestActionResponse result = friendService.sendFriendRequest(userAId, "BOB1234567");

        assertNotNull(result);
        assertEquals("ACCEPTED", result.getStatus());
        assertEquals(ConnectionStatus.ACCEPTED, pendingFromBob.getStatus());
        assertNotNull(pendingFromBob.getRespondedAt());
        verify(friendConnectionRepository).save(pendingFromBob);
    }

    @Test
    @DisplayName("Sending request to self returns 400 Bad Request")
    void sendFriendRequest_self_returns400() {
        when(userRepository.findByFriendCode("ALICE12345")).thenReturn(Optional.of(userA));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                friendService.sendFriendRequest(userAId, "ALICE12345")
        );

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Cannot send friend request to yourself"));
    }

    @Test
    @DisplayName("Sending request when already sent returns 409 Conflict")
    void sendFriendRequest_alreadySent_returns409() {
        FriendConnection existing = FriendConnection.builder()
                .userA(userA)
                .userB(userB)
                .requestedBy(userA)
                .status(ConnectionStatus.PENDING)
                .build();

        when(userRepository.findByFriendCode("BOB1234567")).thenReturn(Optional.of(userB));
        when(userRepository.findById(userAId)).thenReturn(Optional.of(userA));
        when(friendConnectionRepository.findByUserAAndUserB(userA, userB)).thenReturn(Optional.of(existing));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                friendService.sendFriendRequest(userAId, "BOB1234567")
        );

        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        assertTrue(ex.getReason().contains("already sent"));
    }

    @Test
    @DisplayName("Sending request when already friends returns 409 Conflict")
    void sendFriendRequest_alreadyFriends_returns409() {
        FriendConnection existing = FriendConnection.builder()
                .userA(userA)
                .userB(userB)
                .requestedBy(userA)
                .status(ConnectionStatus.ACCEPTED)
                .build();

        when(userRepository.findByFriendCode("BOB1234567")).thenReturn(Optional.of(userB));
        when(userRepository.findById(userAId)).thenReturn(Optional.of(userA));
        when(friendConnectionRepository.findByUserAAndUserB(userA, userB)).thenReturn(Optional.of(existing));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                friendService.sendFriendRequest(userAId, "BOB1234567")
        );

        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Already friends"));
    }

    @Test
    @DisplayName("Only the recipient can accept a request; requester gets 403")
    void acceptFriendRequest_requesterGets403() {
        UUID requestId = UUID.randomUUID();
        // Alice requested Bob
        FriendConnection conn = FriendConnection.builder()
                .id(requestId)
                .userA(userA)
                .userB(userB)
                .requestedBy(userA)
                .status(ConnectionStatus.PENDING)
                .build();

        when(friendConnectionRepository.findById(requestId)).thenReturn(Optional.of(conn));

        // Alice (the requester) tries to accept
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                friendService.acceptFriendRequest(userAId, requestId)
        );

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Only the recipient can accept"));
    }

    @Test
    @DisplayName("Recipient successfully accepts a request")
    void acceptFriendRequest_recipientSucceeds() {
        UUID requestId = UUID.randomUUID();
        // Alice requested Bob
        FriendConnection conn = FriendConnection.builder()
                .id(requestId)
                .userA(userA)
                .userB(userB)
                .requestedBy(userA)
                .status(ConnectionStatus.PENDING)
                .build();

        when(friendConnectionRepository.findById(requestId)).thenReturn(Optional.of(conn));

        // Bob (recipient) accepts
        FriendRequestActionResponse response = friendService.acceptFriendRequest(userBId, requestId);

        assertEquals("ACCEPTED", response.getStatus());
        assertEquals(ConnectionStatus.ACCEPTED, conn.getStatus());
        assertNotNull(conn.getRespondedAt());
        verify(friendConnectionRepository).save(conn);
    }

    @Test
    @DisplayName("Only the recipient can decline a request; requester gets 403")
    void declineFriendRequest_requesterGets403() {
        UUID requestId = UUID.randomUUID();
        // Alice requested Bob
        FriendConnection conn = FriendConnection.builder()
                .id(requestId)
                .userA(userA)
                .userB(userB)
                .requestedBy(userA)
                .status(ConnectionStatus.PENDING)
                .build();

        when(friendConnectionRepository.findById(requestId)).thenReturn(Optional.of(conn));

        // Alice (requester) tries to decline
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                friendService.declineFriendRequest(userAId, requestId)
        );

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        verify(friendConnectionRepository, never()).delete(any());
    }

    @Test
    @DisplayName("Recipient declining deletes the connection row")
    void declineFriendRequest_recipientSucceeds() {
        UUID requestId = UUID.randomUUID();
        // Alice requested Bob
        FriendConnection conn = FriendConnection.builder()
                .id(requestId)
                .userA(userA)
                .userB(userB)
                .requestedBy(userA)
                .status(ConnectionStatus.PENDING)
                .build();

        when(friendConnectionRepository.findById(requestId)).thenReturn(Optional.of(conn));

        // Bob declines
        friendService.declineFriendRequest(userBId, requestId);

        verify(friendConnectionRepository).delete(conn);
    }

    @Test
    @DisplayName("Regenerating code invalidates old code without affecting existing connections")
    void regenerateFriendCode_invalidatesOldCode() {
        String oldCode = userA.getFriendCode();
        when(userRepository.findById(userAId)).thenReturn(Optional.of(userA));
        when(userRepository.existsByFriendCode(anyString())).thenReturn(false);

        FriendCodeResponse response = friendService.regenerateFriendCode(userAId);

        assertNotNull(response.getCode());
        assertNotEquals(oldCode, response.getCode());
        assertEquals(userA.getFriendCode(), response.getCode());
        verify(userRepository).save(userA);

        // Verify that looking up old code now returns not found
        when(userRepository.findByFriendCode(oldCode)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                friendService.sendFriendRequest(userBId, oldCode)
        );
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }
}
