package com.example.demo.repository;

import com.example.demo.model.MistakeTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MistakeTagRepository extends JpaRepository<MistakeTag, UUID> {
    
    @Query("SELECT t FROM MistakeTag t WHERE t.user IS NULL OR t.user.id = :userId ORDER BY t.name ASC")
    List<MistakeTag> findAllAvailableForUser(@Param("userId") UUID userId);

    @Query("SELECT t FROM MistakeTag t WHERE t.id = :id AND (t.user IS NULL OR t.user.id = :userId)")
    Optional<MistakeTag> findByIdAndAvailableForUser(@Param("id") UUID id, @Param("userId") UUID userId);

    List<MistakeTag> findByUserId(UUID userId);
    void deleteByUserId(UUID userId);
}
