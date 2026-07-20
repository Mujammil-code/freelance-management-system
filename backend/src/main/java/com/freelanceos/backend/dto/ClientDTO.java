package com.freelanceos.backend.dto;

import com.freelanceos.backend.entity.Client;

public record ClientDTO(
    Long id,
    String name,
    String company,
    String email,
    String phone,
    String address,
    String country,
    String gstNumber,
    String notes,
    String status,
    String profilePhoto,
    String website
) {
    public static ClientDTO fromEntity(Client client) {
        if (client == null) return null;
        return new ClientDTO(
            client.getId(),
            client.getName(),
            client.getCompany(),
            client.getEmail(),
            client.getPhone(),
            client.getAddress(),
            client.getCountry(),
            client.getGstNumber(),
            client.getNotes(),
            client.getStatus().name(),
            client.getProfilePhoto(),
            client.getWebsite()
        );
    }
}
