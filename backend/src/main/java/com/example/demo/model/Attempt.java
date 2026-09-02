package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "attempts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attempt {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Problem problem;

    @Column(nullable = false)
    private LocalDate date;

    private String thinkingResult;
    private String codingResult;
    private String timeComplexity;
    private String spaceComplexity;
    private String confidence;

    @Column(columnDefinition = "text")
    private String notes;

    private LocalDate nextRevisitDate;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
