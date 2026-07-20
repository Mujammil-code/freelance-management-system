package com.freelanceos.backend.dto;

import java.util.List;
import java.util.Map;

public record UserDTO(
    Long id,
    String firstName,
    String lastName,
    String email,
    String phone,
    String bio,
    String profilePhoto,
    String jobTitle,
    String company,
    List<String> skills,
    Map<String, String> socialLinks,
    String role
) {}
