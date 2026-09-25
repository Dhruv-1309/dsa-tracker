package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "problems", indexes = {
        @Index(name = "idx_problems_user_id", columnList = "user_id"),
        @Index(name = "idx_problems_primary_topic_id", columnList = "primary_topic_id"),
        @Index(name = "idx_problems_user_created_at", columnList = "user_id, created_at"),
        @Index(name = "idx_problems_user_status", columnList = "user_id, current_status"),
        @Index(name = "idx_problems_user_next_revisit", columnList = "user_id, next_revisit_date")
})
@BatchSize(size = 100)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Problem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String platform;

    private String url;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Difficulty difficulty;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "primary_topic_id", nullable = false)
    private Topic primaryTopic;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "problem_topics",
            joinColumns = @JoinColumn(name = "problem_id"),
            inverseJoinColumns = @JoinColumn(name = "topic_id")
    )
    @BatchSize(size = 100)
    @Builder.Default
    private Set<Topic> extraTopics = new HashSet<>();

    private String optimalTime;
    private String optimalSpace;

    @Column(name = "current_status")
    private String currentStatus;

    @Column(name = "last_successful_at")
    private LocalDateTime lastSuccessfulAt;

    @Column(name = "next_revisit_date")
    private LocalDate nextRevisitDate;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
