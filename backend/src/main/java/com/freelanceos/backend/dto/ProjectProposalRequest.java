package com.freelanceos.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record ProjectProposalRequest(
    @NotBlank(message = "Project name is required")
    String name,
    
    String description,
    String category,
    
    @NotNull(message = "Budget is required")
    BigDecimal budget,
    
    LocalDate deadline
) {}
