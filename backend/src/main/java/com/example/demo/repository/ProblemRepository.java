package com.example.demo.repository;

import com.example.demo.model.Problem;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProblemRepository extends JpaRepository<Problem, UUID>, JpaSpecificationExecutor<Problem> {

    @Override
    @EntityGraph(attributePaths = {"primaryTopic"})
    List<Problem> findAll(Specification<Problem> spec, Sort sort);

    @EntityGraph(attributePaths = {"primaryTopic"})
    Optional<Problem> findByIdAndUserId(UUID id, UUID userId);

    @Query("SELECT DISTINCT p FROM Problem p LEFT JOIN FETCH p.primaryTopic LEFT JOIN FETCH p.extraTopics WHERE p.user.id = :userId")
    List<Problem> findByUserIdWithTopics(@Param("userId") UUID userId);

    List<Problem> findByUserId(UUID userId);
    void deleteByIdAndUserId(UUID id, UUID userId);
    void deleteByUserId(UUID userId);
    long countByUserId(UUID userId);

    @Query("SELECT p.currentStatus, COUNT(p) FROM Problem p WHERE p.user.id = :userId GROUP BY p.currentStatus")
    List<Object[]> countByStatusForUser(@Param("userId") UUID userId);

    @Query("SELECT p.difficulty, COUNT(p) FROM Problem p WHERE p.user.id = :userId GROUP BY p.difficulty")
    List<Object[]> countByDifficultyForUser(@Param("userId") UUID userId);

    @Query("SELECT p.platform, COUNT(p) FROM Problem p WHERE p.user.id = :userId GROUP BY p.platform")
    List<Object[]> countByPlatformForUser(@Param("userId") UUID userId);

    @Query("SELECT COUNT(p) FROM Problem p WHERE p.user.id = :userId AND p.nextRevisitDate <= :today")
    long countDueOrOverdueForUser(@Param("userId") UUID userId, @Param("today") java.time.LocalDate today);
}
