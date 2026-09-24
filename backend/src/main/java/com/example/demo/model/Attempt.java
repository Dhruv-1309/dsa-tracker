package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "attempted_at", nullable = false)
    private LocalDateTime attemptedAt;

    @Column(nullable = false)
    private String result;

    @Column(nullable = false)
    private boolean understood;

    @Column(name = "logic_found", nullable = false)
    private boolean logicFound;

    @Column(name = "code_completed", nullable = false)
    private boolean codeCompleted;

    @Column(name = "time_taken_min")
    private Integer timeTakenMin;

    @Column(name = "time_complexity")
    private String timeComplexity;

    @Column(name = "space_complexity")
    private String spaceComplexity;

    @Column(columnDefinition = "smallint")
    private Integer confidence; // 1-5

    @Column(columnDefinition = "text")
    private String approach;

    @Column(columnDefinition = "text")
    private String mistakes;

    @Column(columnDefinition = "text")
    private String code;

    private String language;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "attempt_mistake_tags",
            joinColumns = @JoinColumn(name = "attempt_id"),
            inverseJoinColumns = @JoinColumn(name = "mistake_tag_id")
    )
    @Builder.Default
    private Set<MistakeTag> mistakeTags = new HashSet<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
