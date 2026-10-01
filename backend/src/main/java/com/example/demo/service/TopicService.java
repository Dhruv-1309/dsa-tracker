package com.example.demo.service;

import com.example.demo.dto.TopicRequest;
import com.example.demo.dto.TopicResponse;
import com.example.demo.model.Topic;
import com.example.demo.model.User;
import com.example.demo.repository.ProblemRepository;
import com.example.demo.repository.TopicRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TopicService {

    private final TopicRepository topicRepository;
    private final UserRepository userRepository;
    private final ProblemRepository problemRepository;

    public List<TopicResponse> getTopics(UUID userId) {
        return topicRepository.findAllAvailableForUser(userId).stream()
                .map(topic -> {
                    // For M0/M1 performance, this isn't strictly F-29 yet, but it populates the dropdown
                    // F-04: topic page with problem count
                    return TopicResponse.builder()
                            .id(topic.getId())
                            .name(topic.getName())
                            .isSystem(topic.isSystem())
                            // .problemCount(...) if needed, leaving it 0 for now
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public TopicResponse createTopic(TopicRequest request, UUID userId) {
        User user = userRepository.findById(userId).orElseThrow();
        String name = request.getName() != null ? request.getName().trim() : "";

        // If topic already exists for this user (system or custom), return existing
        List<Topic> available = topicRepository.findAllAvailableForUser(userId);
        for (Topic t : available) {
            if (t.getName().equalsIgnoreCase(name)) {
                return TopicResponse.builder()
                        .id(t.getId())
                        .name(t.getName())
                        .isSystem(t.isSystem())
                        .problemCount(0)
                        .build();
            }
        }

        Topic topic = Topic.builder()
                .name(name)
                .user(user)
                .isSystem(false)
                .sortOrder(999)
                .build();
        topic = topicRepository.save(topic);
        return TopicResponse.builder()
                .id(topic.getId())
                .name(topic.getName())
                .isSystem(false)
                .problemCount(0)
                .build();
    }
}
