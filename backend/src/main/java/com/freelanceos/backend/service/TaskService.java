package com.freelanceos.backend.service;

import com.freelanceos.backend.dto.TaskDTO;
import com.freelanceos.backend.dto.TaskRequest;
import com.freelanceos.backend.dto.TaskStatusUpdate;
import com.freelanceos.backend.entity.Project;
import com.freelanceos.backend.entity.Task;
import com.freelanceos.backend.entity.User;
import com.freelanceos.backend.exception.ResourceNotFoundException;
import com.freelanceos.backend.exception.BadRequestException;
import com.freelanceos.backend.repository.TaskRepository;
import com.freelanceos.backend.util.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectService projectService;

    public TaskService(TaskRepository taskRepository, ProjectService projectService) {
        this.taskRepository = taskRepository;
        this.projectService = projectService;
    }

    private User getAuthenticatedUser() {
        User user = SecurityUtils.getCurrentUser();
        if (user == null) {
            throw new BadRequestException("User not authenticated");
        }
        return user;
    }

    @Transactional(readOnly = true)
    public List<TaskDTO> getTasksByProjectId(Long projectId) {
        Project project = projectService.getProjectEntity(projectId); // validates project ownership
        return taskRepository.findByProjectIdOrderByPositionAsc(project.getId()).stream()
                .map(TaskDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TaskDTO> getMyTasks() {
        User user = getAuthenticatedUser();
        List<Task> tasks;
        if (user.getRole() == User.Role.ADMIN) {
            tasks = taskRepository.findByUserId(user.getId());
        } else {
            tasks = taskRepository.findByClientEmail(user.getEmail());
        }
        return tasks.stream()
                .map(TaskDTO::fromEntity)
                .toList();
    }

    @Transactional
    public TaskDTO createTask(TaskRequest request) {
        User user = getAuthenticatedUser();
        Project project = projectService.getProjectEntity(request.projectId());

        Task task = Task.builder()
                .title(request.title())
                .description(request.description())
                .status(request.status() != null ? Task.Status.valueOf(request.status()) : Task.Status.TODO)
                .priority(request.priority() != null ? Task.Priority.valueOf(request.priority()) : Task.Priority.MEDIUM)
                .dueDate(request.dueDate())
                .assignedTo(request.assignedTo())
                .labels(request.labels() != null ? request.labels() : new ArrayList<>())
                .project(project)
                .user(user)
                .position(request.position())
                .build();

        Task savedTask = taskRepository.save(task);
        return TaskDTO.fromEntity(savedTask);
    }

    @Transactional
    public TaskDTO updateTask(Long id, TaskRequest request) {
        Task task = getTaskEntity(id);
        Project project = projectService.getProjectEntity(request.projectId());

        task.setTitle(request.title());
        task.setDescription(request.description());
        if (request.status() != null) {
            task.setStatus(Task.Status.valueOf(request.status()));
        }
        if (request.priority() != null) {
            task.setPriority(Task.Priority.valueOf(request.priority()));
        }
        task.setDueDate(request.dueDate());
        task.setAssignedTo(request.assignedTo());
        task.setLabels(request.labels() != null ? request.labels() : new ArrayList<>());
        task.setProject(project);
        task.setPosition(request.position());

        Task updated = taskRepository.save(task);
        return TaskDTO.fromEntity(updated);
    }

    @Transactional
    public TaskDTO updateTaskStatus(Long id, TaskStatusUpdate statusUpdate) {
        Task task = getTaskEntity(id);
        task.setStatus(Task.Status.valueOf(statusUpdate.status()));
        task.setPosition(statusUpdate.position());
        Task updated = taskRepository.save(task);
        return TaskDTO.fromEntity(updated);
    }

    @Transactional
    public void deleteTask(Long id) {
        Task task = getTaskEntity(id);
        taskRepository.delete(task);
    }

    private Task getTaskEntity(Long id) {
        User user = getAuthenticatedUser();
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
        if (!task.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Unauthorized access to this task");
        }
        return task;
    }
}
