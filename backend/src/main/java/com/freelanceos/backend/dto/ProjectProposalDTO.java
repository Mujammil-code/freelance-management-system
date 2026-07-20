package com.freelanceos.backend.dto;

import com.freelanceos.backend.entity.ProjectProposal;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record ProjectProposalDTO(
    Long id,
    String name,
    String description,
    String category,
    BigDecimal budget,
    LocalDate deadline,
    String status,
    String clientEmail,
    String clientName,
    BigDecimal originalBudget,
    String lastSuggestedBy,
    String negotiationNotes,
    LocalDateTime createdAt
) {
    public static ProjectProposalDTO fromEntity(ProjectProposal proposal) {
        if (proposal == null) return null;
        return new ProjectProposalDTO(
            proposal.getId(),
            proposal.getName(),
            proposal.getDescription(),
            proposal.getCategory(),
            proposal.getBudget(),
            proposal.getDeadline(),
            proposal.getStatus().name(),
            proposal.getClientEmail(),
            proposal.getClientName(),
            proposal.getOriginalBudget(),
            proposal.getLastSuggestedBy(),
            proposal.getNegotiationNotes(),
            proposal.getCreatedAt()
        );
    }
}
