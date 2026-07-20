package com.freelanceos.backend.controller;

import com.freelanceos.backend.dto.ProjectProposalDTO;
import com.freelanceos.backend.dto.ProjectProposalRequest;
import com.freelanceos.backend.service.ProjectProposalService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/project-proposals")
public class ProjectProposalController {

    private final ProjectProposalService proposalService;

    public ProjectProposalController(ProjectProposalService proposalService) {
        this.proposalService = proposalService;
    }

    @PostMapping
    public ResponseEntity<ProjectProposalDTO> createProposal(@Valid @RequestBody ProjectProposalRequest request) {
        return ResponseEntity.ok(proposalService.createProposal(request));
    }

    @GetMapping
    public ResponseEntity<List<ProjectProposalDTO>> getProposals() {
        return ResponseEntity.ok(proposalService.getProposals());
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<ProjectProposalDTO> approveProposal(@PathVariable Long id) {
        return ResponseEntity.ok(proposalService.approveProposal(id));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<ProjectProposalDTO> rejectProposal(@PathVariable Long id) {
        return ResponseEntity.ok(proposalService.rejectProposal(id));
    }

    @PostMapping("/{id}/counter")
    public ResponseEntity<ProjectProposalDTO> counterProposal(@PathVariable Long id, @RequestBody CounterRequest request) {
        return ResponseEntity.ok(proposalService.counterProposal(id, request.budget(), request.notes()));
    }

    @PostMapping("/{id}/client-counter")
    public ResponseEntity<ProjectProposalDTO> clientCounterProposal(@PathVariable Long id, @RequestBody CounterRequest request) {
        return ResponseEntity.ok(proposalService.clientCounterProposal(id, request.budget(), request.notes()));
    }

    public record CounterRequest(
        BigDecimal budget,
        String notes
    ) {}
}
