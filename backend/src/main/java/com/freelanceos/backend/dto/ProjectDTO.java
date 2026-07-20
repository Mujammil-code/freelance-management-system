package com.freelanceos.backend.dto;

import com.freelanceos.backend.entity.Project;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ProjectDTO(
    Long id,
    String name,
    String description,
    String category,
    BigDecimal budget,
    BigDecimal amountPaid,
    LocalDate startDate,
    LocalDate deadline,
    String priority,
    String status,
    int progress,
    List<String> technologies,
    Long clientId,
    String clientName,
    String sourceUrl,
    String sourceInstructions
) {
    public static ProjectDTO fromEntity(Project project) {
        if (project == null) return null;
        return new ProjectDTO(
            project.getId(),
            project.getName(),
            project.getDescription(),
            project.getCategory(),
            project.getBudget(),
            project.getAmountPaid(),
            project.getStartDate(),
            project.getDeadline(),
            project.getPriority().name(),
            project.getStatus().name(),
            project.getProgress(),
            project.getTechnologies(),
            project.getClient().getId(),
            project.getClient().getName(),
            project.getSourceUrl(),
            project.getSourceInstructions()
        );
    }
}
