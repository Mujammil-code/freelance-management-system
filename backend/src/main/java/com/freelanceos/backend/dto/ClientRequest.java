package com.freelanceos.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ClientRequest(
    @NotBlank(message = "Client name is required")
    String name,
    
    String company,
    
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    String email,
    
    String phone,
    String address,
    String country,
    String gstNumber,
    String notes,
    String status,
    String website,
    String profilePhoto
) {}
