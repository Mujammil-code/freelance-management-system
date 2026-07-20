package com.freelanceos.backend.repository;

import com.freelanceos.backend.entity.FileAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FileAttachmentRepository extends JpaRepository<FileAttachment, Long> {
    List<FileAttachment> findByProjectId(Long projectId);
    List<FileAttachment> findByUserId(Long userId);
}
