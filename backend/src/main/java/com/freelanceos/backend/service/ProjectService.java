package com.freelanceos.backend.service;

import com.freelanceos.backend.dto.ProjectDTO;
import com.freelanceos.backend.dto.ProjectRequest;
import com.freelanceos.backend.entity.Client;
import com.freelanceos.backend.entity.Project;
import com.freelanceos.backend.entity.User;
import com.freelanceos.backend.exception.ResourceNotFoundException;
import com.freelanceos.backend.exception.BadRequestException;
import com.freelanceos.backend.repository.ProjectRepository;
import com.freelanceos.backend.util.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ClientService clientService;

    public ProjectService(ProjectRepository projectRepository, ClientService clientService) {
        this.projectRepository = projectRepository;
        this.clientService = clientService;
    }

    private User getAuthenticatedUser() {
        User user = SecurityUtils.getCurrentUser();
        if (user == null) {
            throw new BadRequestException("User not authenticated");
        }
        return user;
    }

    @Transactional(readOnly = true)
    public List<ProjectDTO> getProjects() {
        User user = getAuthenticatedUser();
        List<Project> projects;
        if (user.getRole() == User.Role.ADMIN) {
            projects = projectRepository.findByUserId(user.getId());
        } else {
            projects = projectRepository.findByClientEmail(user.getEmail());
        }
        return projects.stream()
                .map(ProjectDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectDTO getProjectById(Long id) {
        Project project = getProjectEntity(id);
        return ProjectDTO.fromEntity(project);
    }

    @Transactional
    public ProjectDTO createProject(ProjectRequest request) {
        User user = getAuthenticatedUser();
        Client client = clientService.getClientEntity(request.clientId());

        Project project = Project.builder()
                .name(request.name())
                .description(request.description())
                .category(request.category())
                .budget(request.budget())
                .amountPaid(BigDecimal.ZERO)
                .startDate(request.startDate())
                .deadline(request.deadline())
                .priority(request.priority() != null ? Project.Priority.valueOf(request.priority()) : Project.Priority.MEDIUM)
                .status(request.status() != null ? Project.Status.valueOf(request.status()) : Project.Status.PLANNING)
                .progress(request.progress())
                .technologies(request.technologies() != null ? request.technologies() : new ArrayList<>())
                .client(client)
                .user(user)
                .sourceUrl(request.sourceUrl())
                .sourceInstructions(request.sourceInstructions())
                .build();

        Project savedProject = projectRepository.save(project);
        return ProjectDTO.fromEntity(savedProject);
    }

    @Transactional
    public ProjectDTO updateProject(Long id, ProjectRequest request) {
        Project project = getProjectEntity(id);
        Client client = clientService.getClientEntity(request.clientId());

        project.setName(request.name());
        project.setDescription(request.description());
        project.setCategory(request.category());
        project.setBudget(request.budget());
        project.setStartDate(request.startDate());
        project.setDeadline(request.deadline());
        if (request.priority() != null) {
            project.setPriority(Project.Priority.valueOf(request.priority()));
        }
        if (request.status() != null) {
            project.setStatus(Project.Status.valueOf(request.status()));
        }
        project.setProgress(request.progress());
        project.setTechnologies(request.technologies() != null ? request.technologies() : new ArrayList<>());
        project.setClient(client);
        project.setSourceUrl(request.sourceUrl());
        project.setSourceInstructions(request.sourceInstructions());

        Project updatedProject = projectRepository.save(project);
        return ProjectDTO.fromEntity(updatedProject);
    }

    @Transactional
    public void deleteProject(Long id) {
        Project project = getProjectEntity(id);
        projectRepository.delete(project);
    }

    public Project getProjectEntity(Long id) {
        User user = getAuthenticatedUser();
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
        
        boolean isOwner = project.getUser().getId().equals(user.getId());
        boolean isClient = user.getRole() == User.Role.USER && project.getClient().getEmail().equalsIgnoreCase(user.getEmail());
        
        if (!isOwner && !isClient) {
            throw new ResourceNotFoundException("Project not found with id: " + id);
        }
        return project;
    }

    @Transactional
    public Project saveProjectEntity(Project project) {
        return projectRepository.save(project);
    }
}
