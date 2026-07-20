package com.freelanceos.backend.dto;

public record TaskStatusUpdate(
    String status,
    int position
) {}
