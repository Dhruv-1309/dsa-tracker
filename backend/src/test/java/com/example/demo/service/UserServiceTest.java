package com.example.demo.service;

import com.example.demo.dto.ChangePasswordRequest;
import com.example.demo.model.User;
import com.example.demo.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProblemRepository problemRepository;

    @Mock
    private AttemptRepository attemptRepository;

    @Mock
    private TopicRepository topicRepository;

    @Mock
    private MistakeTagRepository mistakeTagRepository;

    @Mock
    private FriendConnectionRepository friendConnectionRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private final UUID testUserId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(testUserId)
                .email("user@example.com")
                .passwordHash("hashedOldPassword")
                .displayName("John Doe")
                .build();
    }

    @Test
    @DisplayName("changePassword updates password hash when current password matches")
    void changePassword_success() {
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("oldPass123", "hashedOldPassword")).thenReturn(true);
        when(passwordEncoder.encode("newPass456")).thenReturn("hashedNewPass");

        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("oldPass123")
                .newPassword("newPass456")
                .build();

        userService.changePassword(testUserId, request);

        assertEquals("hashedNewPass", testUser.getPasswordHash());
        verify(userRepository, times(1)).save(testUser);
    }

    @Test
    @DisplayName("changePassword throws 401 UNAUTHORIZED when current password does not match")
    void changePassword_wrongCurrentPassword() {
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrongPass", "hashedOldPassword")).thenReturn(false);

        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("wrongPass")
                .newPassword("newPass456")
                .build();

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                userService.changePassword(testUserId, request));

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
        assertEquals("Current password does not match", ex.getReason());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("deleteAccount cascades through friend connections, attempts, problems, topics and user")
    void deleteAccount_success() {
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(problemRepository.findByUserId(testUserId)).thenReturn(Collections.emptyList());

        userService.deleteAccount(testUserId);

        verify(friendConnectionRepository, times(1)).deleteByUserId(testUserId);
        verify(attemptRepository, times(1)).deleteByUserId(testUserId);
        verify(problemRepository, times(1)).deleteAll(Collections.emptyList());
        verify(mistakeTagRepository, times(1)).deleteByUserId(testUserId);
        verify(topicRepository, times(1)).deleteByUserId(testUserId);
        verify(userRepository, times(1)).delete(testUser);
    }
}
