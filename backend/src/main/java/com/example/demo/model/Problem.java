package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "problems")
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
    private String name;

    private String topic;
    
    private String link;

    @Column(columnDefinition = "smallint")
    private Integer difficulty;

    @Column(columnDefinition = "text")
    private String approachNotes;

    private String status;

    private String confidence;

    private LocalDate nextRevisitDate;

    @Builder.Default
    @Column(nullable = false)
    private Integer totalAttempts = 0;

    @Builder.Default
    @Column(nullable = false)
    private Integer timesSolved = 0;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
