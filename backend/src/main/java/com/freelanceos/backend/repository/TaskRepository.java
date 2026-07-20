package com.freelanceos.backend.repository;

import com.freelanceos.backend.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByProjectIdOrderByPositionAsc(Long projectId);
    List<Task> findByUserId(Long userId);
    List<Task> findByUserIdAndStatusNot(Long userId, Task.Status status);
    
    @Query("SELECT t FROM Task t WHERE t.project.client.email = :email ORDER BY t.position ASC")
    List<Task> findByClientEmail(@Param("email") String email);
    
    @Query("SELECT COUNT(t) FROM Task t WHERE t.user.id = :userId AND t.dueDate = :date AND t.status != 'COMPLETED'")
    long countTasksDueToday(Long userId, LocalDate date);
}
