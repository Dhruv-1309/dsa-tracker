package com.example.demo.repository;

import com.example.demo.model.Attempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AttemptRepository extends JpaRepository<Attempt, UUID> {
    List<Attempt> findByProblemIdOrderByCreatedAtDesc(UUID problemId);
}
