package com.freelanceos.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;

public record TaskRequest(
    @NotBlank(message = "Task title is required")
    String title,
    
    String description,
    String status,
    String priority,
    LocalDate dueDate,
    String assignedTo,
    List<String> labels,
    
    @NotNull(message = "Project ID is required")
    Long projectId,
    
    int position
) {}
