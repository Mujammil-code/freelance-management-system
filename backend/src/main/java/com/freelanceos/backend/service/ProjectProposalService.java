package com.freelanceos.backend.service;

import com.freelanceos.backend.dto.ProjectProposalDTO;
import com.freelanceos.backend.dto.ProjectProposalRequest;
import com.freelanceos.backend.dto.ProjectRequest;
import com.freelanceos.backend.dto.ProjectDTO;
import com.freelanceos.backend.dto.InvoiceRequest;
import com.freelanceos.backend.entity.*;
import com.freelanceos.backend.exception.BadRequestException;
import com.freelanceos.backend.exception.ResourceNotFoundException;
import com.freelanceos.backend.repository.ProjectProposalRepository;
import com.freelanceos.backend.repository.ClientRepository;
import com.freelanceos.backend.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class ProjectProposalService {

    private final ProjectProposalRepository proposalRepository;
    private final ProjectService projectService;
    private final ClientRepository clientRepository;
    private final UserRepository userRepository;
    private final InvoiceService invoiceService;

    public ProjectProposalService(
            ProjectProposalRepository proposalRepository,
            ProjectService projectService,
            ClientRepository clientRepository,
            UserRepository userRepository,
            InvoiceService invoiceService) {
        this.proposalRepository = proposalRepository;
        this.projectService = projectService;
        this.clientRepository = clientRepository;
        this.userRepository = userRepository;
        this.invoiceService = invoiceService;
    }

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
    }

    @Transactional
    public ProjectProposalDTO createProposal(ProjectProposalRequest request) {
        User user = getAuthenticatedUser();
        ProjectProposal proposal = ProjectProposal.builder()
                .name(request.name())
                .description(request.description())
                .category(request.category())
                .budget(request.budget())
                .originalBudget(request.budget())
                .deadline(request.deadline())
                .clientEmail(user.getEmail())
                .clientName(user.getFirstName() + " " + user.getLastName())
                .status(ProjectProposal.Status.PENDING)
                .lastSuggestedBy("CLIENT")
                .build();
        ProjectProposal saved = proposalRepository.save(proposal);
        return ProjectProposalDTO.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<ProjectProposalDTO> getProposals() {
        User user = getAuthenticatedUser();
        List<ProjectProposal> proposals;
        if (user.getRole() == User.Role.ADMIN) {
            proposals = proposalRepository.findAllByOrderByCreatedAtDesc();
        } else {
            proposals = proposalRepository.findByClientEmail(user.getEmail());
        }
        return proposals.stream().map(ProjectProposalDTO::fromEntity).toList();
    }

    @Transactional
    public ProjectProposalDTO approveProposal(Long id) {
        User admin = getAuthenticatedUser();
        if (admin.getRole() != User.Role.ADMIN) {
            throw new BadRequestException("Unauthorized access to approve proposals");
        }

        ProjectProposal proposal = proposalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal not found with id: " + id));

        if (proposal.getStatus() == ProjectProposal.Status.APPROVED || proposal.getStatus() == ProjectProposal.Status.REJECTED) {
            throw new BadRequestException("Proposal is already " + proposal.getStatus());
        }

        // Set status to APPROVED
        proposal.setStatus(ProjectProposal.Status.APPROVED);
        proposalRepository.save(proposal);

        // Find or create Client record
        List<Client> existing = clientRepository.findByUserIdAndEmail(admin.getId(), proposal.getClientEmail());
        Client client;
        if (!existing.isEmpty()) {
            client = existing.get(0);
        } else {
            client = Client.builder()
                    .name(proposal.getClientName())
                    .email(proposal.getClientEmail())
                    .status(Client.Status.ACTIVE)
                    .user(admin)
                    .company("Independent")
                    .build();
            client = clientRepository.save(client);
        }

        // Create Project request DTO
        ProjectRequest projectRequest = new ProjectRequest(
                proposal.getName(),
                proposal.getDescription(),
                proposal.getCategory(),
                proposal.getBudget(),
                null, // start date not set yet
                proposal.getDeadline(),
                "MEDIUM",
                "PLANNING",
                0,
                new ArrayList<>(),
                client.getId(),
                null, // sourceUrl
                null  // sourceInstructions
        );

        ProjectDTO createdProject = projectService.createProject(projectRequest);

        // Auto-generate invoice
        BigDecimal amount = proposal.getBudget();
        BigDecimal gst = amount.multiply(BigDecimal.valueOf(0.18)); // Default 18% GST
        BigDecimal totalAmount = amount.add(gst);

        InvoiceRequest.LineItemRequest lineItem = new InvoiceRequest.LineItemRequest(
                "Initial Setup & Project Milestone Release: " + proposal.getName(),
                1,
                amount,
                amount
        );

        InvoiceRequest invoiceRequest = new InvoiceRequest(
                client.getId(),
                createdProject.id(),
                amount,
                gst,
                BigDecimal.ZERO,
                totalAmount,
                LocalDate.now().plusDays(15), // Due in 15 days
                LocalDate.now(),
                "Auto-generated setup invoice for approved workspace proposal.",
                "Payment is due within 15 days of release approval.",
                "SENT",
                List.of(lineItem)
        );

        invoiceService.createInvoice(invoiceRequest);

        return ProjectProposalDTO.fromEntity(proposal);
    }

    @Transactional
    public ProjectProposalDTO counterProposal(Long id, BigDecimal newBudget, String notes) {
        User admin = getAuthenticatedUser();
        if (admin.getRole() != User.Role.ADMIN) {
            throw new BadRequestException("Unauthorized access to suggest counters");
        }

        ProjectProposal proposal = proposalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal not found with id: " + id));

        proposal.setStatus(ProjectProposal.Status.ADMIN_COUNTER);
        proposal.setBudget(newBudget);
        proposal.setLastSuggestedBy("ADMIN");
        proposal.setNegotiationNotes(notes);

        ProjectProposal saved = proposalRepository.save(proposal);
        return ProjectProposalDTO.fromEntity(saved);
    }

    @Transactional
    public ProjectProposalDTO clientCounterProposal(Long id, BigDecimal newBudget, String notes) {
        User clientUser = getAuthenticatedUser();
        ProjectProposal proposal = proposalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal not found with id: " + id));

        if (!proposal.getClientEmail().equalsIgnoreCase(clientUser.getEmail())) {
            throw new BadRequestException("Unauthorized to counter this proposal");
        }

        proposal.setStatus(ProjectProposal.Status.CLIENT_COUNTER);
        proposal.setBudget(newBudget);
        proposal.setLastSuggestedBy("CLIENT");
        proposal.setNegotiationNotes(notes);

        ProjectProposal saved = proposalRepository.save(proposal);
        return ProjectProposalDTO.fromEntity(saved);
    }

    @Transactional
    public ProjectProposalDTO rejectProposal(Long id) {
        User admin = getAuthenticatedUser();
        if (admin.getRole() != User.Role.ADMIN) {
            throw new BadRequestException("Unauthorized access to reject proposals");
        }

        ProjectProposal proposal = proposalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal not found with id: " + id));

        if (proposal.getStatus() == ProjectProposal.Status.APPROVED || proposal.getStatus() == ProjectProposal.Status.REJECTED) {
            throw new BadRequestException("Proposal is already " + proposal.getStatus());
        }

        proposal.setStatus(ProjectProposal.Status.REJECTED);
        proposalRepository.save(proposal);

        return ProjectProposalDTO.fromEntity(proposal);
    }
}
