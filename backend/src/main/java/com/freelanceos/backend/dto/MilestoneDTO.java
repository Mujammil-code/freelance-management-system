package com.freelanceos.backend.dto;

import com.freelanceos.backend.entity.Milestone;
import java.time.LocalDate;

public record MilestoneDTO(
    Long id,
    String title,
    String description,
    LocalDate dueDate,
    String status,
    int completionPercentage,
    Long projectId
) {
    public static MilestoneDTO fromEntity(Milestone milestone) {
        if (milestone == null) return null;
        return new MilestoneDTO(
            milestone.getId(),
            milestone.getTitle(),
            milestone.getDescription(),
            milestone.getDueDate(),
            milestone.getStatus().name(),
            milestone.getCompletionPercentage(),
            milestone.getProject().getId()
        );
    }
}
