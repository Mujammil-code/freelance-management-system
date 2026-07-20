package com.freelanceos.backend.dto;

import com.freelanceos.backend.entity.FileAttachment;
import java.time.LocalDateTime;

public record FileAttachmentDTO(
    Long id,
    String fileName,
    String originalFileName,
    String fileType,
    Long fileSize,
    String fileUrl,
    String category,
    Long projectId,
    String projectName,
    LocalDateTime createdAt
) {
    public static FileAttachmentDTO fromEntity(FileAttachment file) {
        if (file == null) return null;
        return new FileAttachmentDTO(
            file.getId(),
            file.getFileName(),
            file.getOriginalFileName(),
            file.getFileType(),
            file.getFileSize(),
            file.getFileUrl(),
            file.getCategory().name(),
            file.getProject() != null ? file.getProject().getId() : null,
            file.getProject() != null ? file.getProject().getName() : null,
            file.getCreatedAt()
        );
    }
}
