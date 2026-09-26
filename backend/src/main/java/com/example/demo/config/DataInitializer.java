package com.example.demo.config;

import com.example.demo.model.Topic;
import com.example.demo.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Seeds system-level topics on startup if none exist.
 * These are the canonical DSA topic categories shown to all users.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final TopicRepository topicRepository;

    private static final List<String> SYSTEM_TOPICS = List.of(
            "Arrays",
            "Strings",
            "Linked List",
            "Stack",
            "Queue",
            "Hash Map / Hash Set",
            "Trees",
            "Binary Search Tree",
            "Heaps / Priority Queue",
            "Graphs",
            "Tries",
            "Binary Search",
            "Two Pointers",
            "Sliding Window",
            "Recursion",
            "Dynamic Programming",
            "Backtracking",
            "Greedy",
            "Sorting",
            "Bit Manipulation",
            "Math",
            "Other"
    );

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        long systemTopicCount = topicRepository.findAll().stream()
                .filter(Topic::isSystem)
                .count();

        if (systemTopicCount == 0) {
            log.info("Seeding {} system topics...", SYSTEM_TOPICS.size());
            for (int i = 0; i < SYSTEM_TOPICS.size(); i++) {
                Topic topic = Topic.builder()
                        .name(SYSTEM_TOPICS.get(i))
                        .isSystem(true)
                        .user(null)
                        .sortOrder(i + 1)
                        .build();
                topicRepository.save(topic);
            }
            log.info("System topics seeded successfully.");
        } else {
            log.debug("System topics already present ({}), skipping seed.", systemTopicCount);
        }
    }
}
