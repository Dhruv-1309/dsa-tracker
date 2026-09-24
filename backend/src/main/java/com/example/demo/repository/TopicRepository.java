package com.example.demo.repository;

import com.example.demo.model.Topic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TopicRepository extends JpaRepository<Topic, UUID> {
    
    @Query("SELECT t FROM Topic t WHERE t.isSystem = true OR t.user.id = :userId ORDER BY t.sortOrder ASC, t.name ASC")
    List<Topic> findAllAvailableForUser(@Param("userId") UUID userId);

    @Query("SELECT t FROM Topic t WHERE t.id = :id AND (t.isSystem = true OR t.user.id = :userId)")
    Optional<Topic> findByIdAndAvailableForUser(@Param("id") UUID id, @Param("userId") UUID userId);
    
    Optional<Topic> findByName(String name);
    List<Topic> findByUserId(UUID userId);
    void deleteByUserId(UUID userId);
}
