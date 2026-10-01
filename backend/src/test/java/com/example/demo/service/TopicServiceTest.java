package com.example.demo.service;

import com.example.demo.dto.TopicRequest;
import com.example.demo.dto.TopicResponse;
import com.example.demo.model.Topic;
import com.example.demo.model.User;
import com.example.demo.repository.ProblemRepository;
import com.example.demo.repository.TopicRepository;
import com.example.demo.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TopicServiceTest {

    @Mock
    private TopicRepository topicRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProblemRepository problemRepository;

    @InjectMocks
    private TopicService topicService;

    private User testUser;
    private final UUID testUserId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(testUserId)
                .email("test@example.com")
                .passwordHash("hashed")
                .build();
    }

    @Test
    @DisplayName("getTopics returns available topics for user")
    void getTopics_returnsAvailableTopics() {
        Topic systemTopic = Topic.builder()
                .id(UUID.randomUUID())
                .name("Arrays")
                .isSystem(true)
                .build();
        Topic customTopic = Topic.builder()
                .id(UUID.randomUUID())
                .name("Segment Tree")
                .isSystem(false)
                .user(testUser)
                .build();

        when(topicRepository.findAllAvailableForUser(testUserId)).thenReturn(List.of(systemTopic, customTopic));

        List<TopicResponse> responses = topicService.getTopics(testUserId);

        assertEquals(2, responses.size());
        assertEquals("Arrays", responses.get(0).getName());
        assertTrue(responses.get(0).isSystem());
        assertEquals("Segment Tree", responses.get(1).getName());
        assertFalse(responses.get(1).isSystem());
    }

    @Test
    @DisplayName("createTopic creates new custom topic if not existing")
    void createTopic_createsNewTopic() {
        UUID newTopicId = UUID.randomUUID();
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(topicRepository.findAllAvailableForUser(testUserId)).thenReturn(List.of());
        when(topicRepository.save(any(Topic.class))).thenAnswer(invocation -> {
            Topic saved = invocation.getArgument(0);
            saved.setId(newTopicId);
            return saved;
        });

        TopicRequest request = new TopicRequest("Trie");
        TopicResponse response = topicService.createTopic(request, testUserId);

        assertNotNull(response);
        assertEquals(newTopicId, response.getId());
        assertEquals("Trie", response.getName());
        assertFalse(response.isSystem());
        verify(topicRepository).save(any(Topic.class));
    }

    @Test
    @DisplayName("createTopic reuses existing topic if name matches case-insensitively")
    void createTopic_reusesExistingTopic() {
        UUID existingId = UUID.randomUUID();
        Topic existing = Topic.builder()
                .id(existingId)
                .name("Dynamic Programming")
                .isSystem(true)
                .build();

        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(topicRepository.findAllAvailableForUser(testUserId)).thenReturn(List.of(existing));

        TopicRequest request = new TopicRequest("dynamic programming");
        TopicResponse response = topicService.createTopic(request, testUserId);

        assertNotNull(response);
        assertEquals(existingId, response.getId());
        assertEquals("Dynamic Programming", response.getName());
        assertTrue(response.isSystem());
        verify(topicRepository, never()).save(any(Topic.class));
    }
}
