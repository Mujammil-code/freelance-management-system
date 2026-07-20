package com.freelanceos.backend.controller;

import com.freelanceos.backend.entity.Notification;
import com.freelanceos.backend.entity.User;
import com.freelanceos.backend.exception.BadRequestException;
import com.freelanceos.backend.exception.ResourceNotFoundException;
import com.freelanceos.backend.repository.NotificationRepository;
import com.freelanceos.backend.util.SecurityUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationRepository notificationRepository;

    public NotificationController(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    private User getAuthenticatedUser() {
        User user = SecurityUtils.getCurrentUser();
        if (user == null) {
            throw new BadRequestException("User not authenticated");
        }
        return user;
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications() {
        User user = getAuthenticatedUser();
        List<Notification> notifications = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(user.getId());
        return ResponseEntity.ok(notifications);
    }

    @PatchMapping("/{id}/read")
    @Transactional
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));
        if (!notification.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Unauthorized access to notification");
        }
        notification.setRead(true);
        notificationRepository.save(notification);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/read-all")
    @Transactional
    public ResponseEntity<Void> readAll() {
        User user = getAuthenticatedUser();
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(user.getId());
        for (Notification n : unread) {
            n.setRead(true);
        }
        notificationRepository.saveAll(unread);
        return ResponseEntity.noContent().build();
    }
}
