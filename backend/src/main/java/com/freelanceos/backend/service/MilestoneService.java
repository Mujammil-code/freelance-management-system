package com.freelanceos.backend.service;

import com.freelanceos.backend.dto.MilestoneDTO;
import com.freelanceos.backend.dto.MilestoneRequest;
import com.freelanceos.backend.entity.Milestone;
import com.freelanceos.backend.entity.Project;
import com.freelanceos.backend.exception.ResourceNotFoundException;
import com.freelanceos.backend.exception.BadRequestException;
import com.freelanceos.backend.repository.MilestoneRepository;
import com.freelanceos.backend.entity.User;
import com.freelanceos.backend.util.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MilestoneService {

    private final MilestoneRepository milestoneRepository;
    private final ProjectService projectService;

    public MilestoneService(MilestoneRepository milestoneRepository, ProjectService projectService) {
        this.milestoneRepository = milestoneRepository;
        this.projectService = projectService;
    }

    @Transactional(readOnly = true)
    public List<MilestoneDTO> getMilestones() {
        List<Milestone> allMilestones = milestoneRepository.findAll();
        User user = SecurityUtils.getCurrentUser();
        if (user == null) {
            throw new BadRequestException("User not authenticated");
        }

        List<Milestone> filtered;
        if (user.getRole() == User.Role.ADMIN) {
            filtered = allMilestones.stream()
                .filter(m -> m.getProject().getUser().getId().equals(user.getId()))
                .toList();
        } else {
            filtered = allMilestones.stream()
                .filter(m -> m.getProject().getClient() != null && m.getProject().getClient().getEmail().equalsIgnoreCase(user.getEmail()))
                .toList();
        }

        return filtered.stream()
            .map(MilestoneDTO::fromEntity)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<MilestoneDTO> getMilestonesByProjectId(Long projectId) {
        Project project = projectService.getProjectEntity(projectId); // validates project ownership
        return milestoneRepository.findByProjectId(project.getId()).stream()
                .map(MilestoneDTO::fromEntity)
                .toList();
    }

    @Transactional
    public MilestoneDTO createMilestone(MilestoneRequest request) {
        Project project = projectService.getProjectEntity(request.projectId());
        Milestone milestone = Milestone.builder()
                .title(request.title())
                .description(request.description())
                .dueDate(request.dueDate())
                .status(request.status() != null ? Milestone.Status.valueOf(request.status()) : Milestone.Status.PENDING)
                .completionPercentage(request.completionPercentage())
                .project(project)
                .build();

        Milestone savedMilestone = milestoneRepository.save(milestone);
        return MilestoneDTO.fromEntity(savedMilestone);
    }

    @Transactional
    public MilestoneDTO updateMilestone(Long id, MilestoneRequest request) {
        Milestone milestone = getMilestoneEntity(id);
        milestone.setTitle(request.title());
        milestone.setDescription(request.description());
        milestone.setDueDate(request.dueDate());
        if (request.status() != null) {
            milestone.setStatus(Milestone.Status.valueOf(request.status()));
        }
        milestone.setCompletionPercentage(request.completionPercentage());

        Milestone updated = milestoneRepository.save(milestone);
        return MilestoneDTO.fromEntity(updated);
    }

    @Transactional
    public void deleteMilestone(Long id) {
        Milestone milestone = getMilestoneEntity(id);
        milestoneRepository.delete(milestone);
    }

    private Milestone getMilestoneEntity(Long id) {
        Milestone milestone = milestoneRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone not found with id: " + id));
        projectService.getProjectEntity(milestone.getProject().getId()); // validates project ownership
        return milestone;
    }
}
