package com.freelanceos.backend.dto;

import java.util.List;

public record AiEstimationRequest(
    String projectType,
    Integer numberOfPages,
    String complexity,
    List<String> technologies,
    List<String> features,
    Integer teamSize,
    Integer deadline,
    String description
) {}
