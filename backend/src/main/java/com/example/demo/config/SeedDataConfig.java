package com.example.demo.config;

import com.example.demo.model.MistakeTag;
import com.example.demo.model.Topic;
import com.example.demo.repository.MistakeTagRepository;
import com.example.demo.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class SeedDataConfig {

    private final TopicRepository topicRepository;
    private final MistakeTagRepository mistakeTagRepository;

    @Bean
    public CommandLineRunner seedData() {
        return args -> {
            seedTopics();
            seedMistakeTags();
        };
    }

    private void seedTopics() {
        if (topicRepository.count() == 0) {
            List<String> topics = Arrays.asList(
                    "Arrays", "Strings", "Hashing", "Two Pointers", "Sliding Window", 
                    "Prefix Sum", "Sorting", "Binary Search", "Linked List", "Stack", 
                    "Queue", "Recursion", "Backtracking", "Binary Trees", "Binary Search Trees", 
                    "Heap / Priority Queue", "Graphs", "Union Find", "Dynamic Programming", 
                    "Greedy", "Intervals", "Matrix", "Tries", "Bit Manipulation", "Math", "Other"
            );
            int order = 1;
            for (String name : topics) {
                topicRepository.save(Topic.builder()
                        .name(name)
                        .isSystem(true)
                        .sortOrder(order++)
                        .build());
            }
        }
    }

    private void seedMistakeTags() {
        if (mistakeTagRepository.count() == 0) {
            List<String> tags = Arrays.asList(
                    "Missed edge case", "Off-by-one", "Wrong data structure", "Wrong approach", 
                    "Time limit exceeded", "Misread the problem", "Implementation bug", 
                    "Forgot base case", "Overflow or type issue"
            );
            for (String name : tags) {
                mistakeTagRepository.save(MistakeTag.builder()
                        .name(name)
                        .build());
            }
        }
    }
}
