package com.example.demo.repository;

import com.example.demo.model.Attempt;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AttemptRepository extends JpaRepository<Attempt, UUID> {
    @EntityGraph(attributePaths = {"mistakeTags"})
    List<Attempt> findByProblemIdAndUserIdOrderByAttemptedAtDesc(UUID problemId, UUID userId);
    List<Attempt> findByUserId(UUID userId);
    void deleteByUserId(UUID userId);

    @Query(value = "SELECT DATE(a.attempted_at) as attempt_date, COUNT(a.id) FROM attempts a WHERE a.user_id = :userId AND EXTRACT(YEAR FROM a.attempted_at) = :year GROUP BY DATE(a.attempted_at)", nativeQuery = true)
    List<Object[]> countAttemptsByDateForUserAndYear(@Param("userId") UUID userId, @Param("year") int year);

    @Query(value = "SELECT mt.name, COUNT(amt.attempt_id) FROM mistake_tags mt JOIN attempt_mistake_tags amt ON mt.id = amt.mistake_tag_id JOIN attempts a ON a.id = amt.attempt_id WHERE a.user_id = :userId GROUP BY mt.name ORDER BY COUNT(amt.attempt_id) DESC", nativeQuery = true)
    List<Object[]> countMistakeTagsForUser(@Param("userId") UUID userId);
}
