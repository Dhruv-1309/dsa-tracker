package com.example.demo.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String email;

    @JsonIgnore
    @Column(nullable = false)
    private String passwordHash;

    @Column(name = "display_name")
    private String displayName;

    @Column
    private String timezone;

    @Column(name = "friend_code", unique = true, length = 12)
    private String friendCode;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
