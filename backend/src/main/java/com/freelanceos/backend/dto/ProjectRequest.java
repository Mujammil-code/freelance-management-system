package com.freelanceos.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ProjectRequest(
    @NotBlank(message = "Project name is required")
    String name,
    
    String description,
    String category,
    
    @NotNull(message = "Budget is required")
    BigDecimal budget,
    
    LocalDate startDate,
    LocalDate deadline,
    String priority,
    String status,
    int progress,
    List<String> technologies,
    
    @NotNull(message = "Client is required")
    Long clientId,

    String sourceUrl,
    String sourceInstructions
) {}
