package com.freelanceos.backend.dto;

public record AuthRequest(
    String email,
    String password,
    boolean rememberMe
) {}
