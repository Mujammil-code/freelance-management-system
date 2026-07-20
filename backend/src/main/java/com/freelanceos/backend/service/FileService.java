package com.freelanceos.backend.service;

import com.freelanceos.backend.dto.FileAttachmentDTO;
import com.freelanceos.backend.entity.FileAttachment;
import com.freelanceos.backend.entity.Project;
import com.freelanceos.backend.entity.User;
import com.freelanceos.backend.exception.ResourceNotFoundException;
import com.freelanceos.backend.exception.BadRequestException;
import com.freelanceos.backend.repository.FileAttachmentRepository;
import com.freelanceos.backend.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
public class FileService {

    private final FileAttachmentRepository fileAttachmentRepository;
    private final ProjectService projectService;
    private final Path fileStorageLocation;

    public FileService(
            FileAttachmentRepository fileAttachmentRepository,
            ProjectService projectService,
            @Value("${file.upload-dir}") String uploadDir
    ) {
        this.fileAttachmentRepository = fileAttachmentRepository;
        this.projectService = projectService;
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new BadRequestException("Could not create the directory where the uploaded files will be stored.");
        }
    }

    private User getAuthenticatedUser() {
        User user = SecurityUtils.getCurrentUser();
        if (user == null) {
            throw new BadRequestException("User not authenticated");
        }
        return user;
    }

    @Transactional
    public FileAttachmentDTO storeFile(MultipartFile file, Long projectId) {
        User user = getAuthenticatedUser();
        Project project = null;
        if (projectId != null) {
            project = projectService.getProjectEntity(projectId);
        }

        String originalFileName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        String fileExtension = "";
        
        int i = originalFileName.lastIndexOf('.');
        if (i > 0) {
            fileExtension = originalFileName.substring(i);
        }

        String fileName = UUID.randomUUID().toString() + fileExtension;

        try {
            if (originalFileName.contains("..")) {
                throw new BadRequestException("Sorry! Filename contains invalid path sequence " + originalFileName);
            }

            Path targetLocation = this.fileStorageLocation.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "/api/files/download/" + fileName;

            // Determine category
            FileAttachment.Category category = FileAttachment.Category.OTHER;
            String contentType = file.getContentType();
            if (contentType != null) {
                if (contentType.contains("image")) {
                    category = FileAttachment.Category.IMAGE;
                } else if (contentType.contains("pdf")) {
                    category = FileAttachment.Category.PDF;
                } else if (contentType.contains("word") || contentType.contains("excel") || contentType.contains("text")) {
                    category = FileAttachment.Category.DOCUMENT;
                } else if (originalFileName.toLowerCase().contains("contract")) {
                    category = FileAttachment.Category.CONTRACT;
                }
            }

            FileAttachment fileAttachment = FileAttachment.builder()
                    .fileName(fileName)
                    .originalFileName(originalFileName)
                    .fileType(file.getContentType())
                    .fileSize(file.getSize())
                    .filePath(targetLocation.toString())
                    .fileUrl(fileUrl)
                    .category(category)
                    .project(project)
                    .user(user)
                    .build();

            FileAttachment saved = fileAttachmentRepository.save(fileAttachment);
            return FileAttachmentDTO.fromEntity(saved);

        } catch (IOException ex) {
            throw new BadRequestException("Could not store file " + originalFileName + ". Please try again!");
        }
    }

    @Transactional(readOnly = true)
    public Resource loadFileAsResource(String fileName) {
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("File not found " + fileName);
            }
        } catch (MalformedURLException ex) {
            throw new ResourceNotFoundException("File not found " + fileName);
        }
    }

    @Transactional(readOnly = true)
    public List<FileAttachmentDTO> getFilesByProject(Long projectId) {
        Project project = projectService.getProjectEntity(projectId); // validates project ownership
        return fileAttachmentRepository.findByProjectId(project.getId()).stream()
                .map(FileAttachmentDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FileAttachmentDTO> getMyFiles() {
        User user = getAuthenticatedUser();
        return fileAttachmentRepository.findByUserId(user.getId()).stream()
                .map(FileAttachmentDTO::fromEntity)
                .toList();
    }

    @Transactional
    public void deleteFile(Long id) {
        User user = getAuthenticatedUser();
        FileAttachment file = fileAttachmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("File not found with id: " + id));
        if (!file.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Unauthorized access to this file");
        }

        // Delete from local storage
        try {
            Path filePath = Paths.get(file.getFilePath());
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            // Log warning, continue deleting db record
        }

        fileAttachmentRepository.delete(file);
    }
}
