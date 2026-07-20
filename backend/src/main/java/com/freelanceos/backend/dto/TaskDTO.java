package com.freelanceos.backend.dto;

import com.freelanceos.backend.entity.Task;
import java.time.LocalDate;
import java.util.List;

public record TaskDTO(
    Long id,
    String title,
    String description,
    String status,
    String priority,
    LocalDate dueDate,
    String assignedTo,
    List<String> labels,
    Long projectId,
    String projectName,
    int position
) {
    public static TaskDTO fromEntity(Task task) {
        if (task == null) return null;
        return new TaskDTO(
            task.getId(),
            task.getTitle(),
            task.getDescription(),
            task.getStatus().name(),
            task.getPriority().name(),
            task.getDueDate(),
            task.getAssignedTo(),
            task.getLabels(),
            task.getProject().getId(),
            task.getProject().getName(),
            task.getPosition()
        );
    }
}
