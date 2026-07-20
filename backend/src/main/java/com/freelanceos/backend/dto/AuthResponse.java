package com.freelanceos.backend.dto;

public record AuthResponse(
    String token,
    String refreshToken,
    UserDTO user
) {}
