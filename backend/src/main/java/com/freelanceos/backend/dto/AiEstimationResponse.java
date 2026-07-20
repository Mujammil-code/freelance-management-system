package com.freelanceos.backend.dto;

import java.util.List;

public record AiEstimationResponse(
    Integer estimatedDays,
    List<String> phases,
    List<String> milestones,
    Integer workingHours,
    List<String> technologyStack,
    String riskLevel,
    Integer difficultyScore,
    String deliverySchedule,
    List<String> warnings
) {}
