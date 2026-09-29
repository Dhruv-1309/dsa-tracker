package com.example.demo.controller;

import com.example.demo.config.GlobalExceptionHandler;
import com.example.demo.dto.FriendCodeResponse;
import com.example.demo.dto.FriendProblemDetailResponse;
import com.example.demo.dto.FriendRequestActionResponse;
import com.example.demo.dto.FriendResponse;
import com.example.demo.dto.FriendSummaryResponse;
import com.example.demo.model.User;
import com.example.demo.security.CustomUserDetails;
import com.example.demo.service.FriendService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class FriendControllerTest {

    @Mock
    private FriendService friendService;

    @InjectMocks
    private FriendController friendController;

    private MockMvc mockMvcWithAuth;
    private MockMvc mockMvcWithoutAuth;

    private final UUID testUserId = UUID.randomUUID();
    private CustomUserDetails testUserDetails;

    @BeforeEach
    void setUp() {
        User testUser = User.builder()
                .id(testUserId)
                .email("test@example.com")
                .displayName("Tester")
                .build();
        testUserDetails = new CustomUserDetails(testUser);

        HandlerMethodArgumentResolver authenticatedResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.getParameterType().equals(CustomUserDetails.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return testUserDetails;
            }
        };

        HandlerMethodArgumentResolver unauthenticatedResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.getParameterType().equals(CustomUserDetails.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return null;
            }
        };

        mockMvcWithAuth = MockMvcBuilders.standaloneSetup(friendController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(authenticatedResolver)
                .build();

        mockMvcWithoutAuth = MockMvcBuilders.standaloneSetup(friendController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(unauthenticatedResolver)
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/friends/{friendUserId}/summary returns 403 when not accepted friends")
    void getFriendSummary_notFriends_returns403() throws Exception {
        UUID friendId = UUID.randomUUID();
        when(friendService.getFriendSummary(eq(testUserId), eq(friendId), any()))
                .thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: You are not accepted friends with this user"));

        mockMvcWithAuth.perform(get("/api/v1/friends/" + friendId + "/summary"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/v1/friends/{friendUserId}/summary returns 200 when accepted friends")
    void getFriendSummary_accepted_returns200() throws Exception {
        UUID friendId = UUID.randomUUID();
        FriendSummaryResponse response = FriendSummaryResponse.builder()
                .friendUserId(friendId)
                .displayName("Friend Name")
                .solvedProblems(Collections.emptyList())
                .heatmap(Collections.emptyList())
                .build();

        when(friendService.getFriendSummary(eq(testUserId), eq(friendId), any()))
                .thenReturn(response);

        mockMvcWithAuth.perform(get("/api/v1/friends/" + friendId + "/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Friend Name"))
                .andExpect(jsonPath("$.email").doesNotExist());
    }

    @Test
    @DisplayName("GET /api/v1/friends/{friendUserId}/problems/{problemId} returns 403 when not friends")
    void getFriendProblemDetail_notFriends_returns403() throws Exception {
        UUID friendId = UUID.randomUUID();
        UUID problemId = UUID.randomUUID();
        when(friendService.getFriendProblemDetail(eq(testUserId), eq(friendId), eq(problemId)))
                .thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: You are not accepted friends with this user"));

        mockMvcWithAuth.perform(get("/api/v1/friends/" + friendId + "/problems/" + problemId))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/v1/friends/{friendUserId}/problems/{problemId} returns 404 when problem not found")
    void getFriendProblemDetail_problemNotFound_returns404() throws Exception {
        UUID friendId = UUID.randomUUID();
        UUID problemId = UUID.randomUUID();
        when(friendService.getFriendProblemDetail(eq(testUserId), eq(friendId), eq(problemId)))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem not found"));

        mockMvcWithAuth.perform(get("/api/v1/friends/" + friendId + "/problems/" + problemId))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/v1/friends/{friendUserId}/problems/{problemId} returns 200 with problem detail and attempts")
    void getFriendProblemDetail_accepted_returnsDetail() throws Exception {
        UUID friendId = UUID.randomUUID();
        UUID problemId = UUID.randomUUID();
        FriendProblemDetailResponse detail = FriendProblemDetailResponse.builder()
                .id(problemId)
                .title("Two Sum")
                .platform("LeetCode")
                .currentStatus("Solved")
                .attempts(Collections.emptyList())
                .build();

        when(friendService.getFriendProblemDetail(eq(testUserId), eq(friendId), eq(problemId)))
                .thenReturn(detail);

        mockMvcWithAuth.perform(get("/api/v1/friends/" + friendId + "/problems/" + problemId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(problemId.toString()))
                .andExpect(jsonPath("$.title").value("Two Sum"))
                .andExpect(jsonPath("$.attempts").isArray());
    }

    @Test
    @DisplayName("POST /api/v1/friends/requests accepts valid code and returns 200")
    void sendFriendRequest_success() throws Exception {
        FriendRequestActionResponse response = FriendRequestActionResponse.builder()
                .message("Friend request sent")
                .status("PENDING")
                .build();

        when(friendService.sendFriendRequest(eq(testUserId), eq("ABC123XYZ4")))
                .thenReturn(response);

        mockMvcWithAuth.perform(post("/api/v1/friends/requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"ABC123XYZ4\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    @DisplayName("POST /api/v1/friends/requests/{id}/accept returns 403 when forbidden")
    void acceptFriendRequest_forbidden() throws Exception {
        UUID requestId = UUID.randomUUID();
        when(friendService.acceptFriendRequest(eq(testUserId), eq(requestId)))
                .thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the recipient can accept this request"));

        mockMvcWithAuth.perform(post("/api/v1/friends/requests/" + requestId + "/accept"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("DELETE /api/v1/friends/{friendUserId} returns 204 No Content")
    void removeFriend_success() throws Exception {
        UUID friendId = UUID.randomUUID();
        doNothing().when(friendService).removeFriend(eq(testUserId), eq(friendId));

        mockMvcWithAuth.perform(delete("/api/v1/friends/" + friendId))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("Friend endpoints reject unauthenticated requests")
    void unauthenticated_returns401() throws Exception {
        mockMvcWithoutAuth.perform(get("/api/v1/friends"))
                .andExpect(status().isUnauthorized());
    }
}
