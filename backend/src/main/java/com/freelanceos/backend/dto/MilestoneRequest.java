package com.freelanceos.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record MilestoneRequest(
    @NotBlank(message = "Milestone title is required")
    String title,
    
    String description,
    LocalDate dueDate,
    String status,
    int completionPercentage,
    
    @NotNull(message = "Project ID is required")
    Long projectId
) {}
