package com.freelanceos.backend.repository;

import com.freelanceos.backend.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByUserId(Long userId);
    List<Project> findByClientId(Long clientId);
    
    @Query("SELECT p FROM Project p WHERE p.client.email = :email")
    List<Project> findByClientEmail(@Param("email") String email);
    
    long countByUserId(Long userId);
    long countByUserIdAndStatus(Long userId, Project.Status status);
    List<Project> findByUserIdAndDeadlineBeforeAndStatusNot(Long userId, LocalDate date, Project.Status status);
}
