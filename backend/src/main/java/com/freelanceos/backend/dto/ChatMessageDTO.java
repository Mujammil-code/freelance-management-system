package com.freelanceos.backend.dto;

import com.freelanceos.backend.entity.ChatMessage;
import java.time.LocalDateTime;

public record ChatMessageDTO(
    Long id,
    String content,
    String messageType,
    Long senderId,
    String senderName,
    String senderPhoto,
    Long receiverId,
    String conversationId,
    boolean isRead,
    LocalDateTime timestamp,
    String fileUrl
) {
    public static ChatMessageDTO fromEntity(ChatMessage msg) {
        if (msg == null) return null;
        return new ChatMessageDTO(
            msg.getId(),
            msg.getContent(),
            msg.getMessageType().name(),
            msg.getSender().getId(),
            msg.getSender().getFirstName() + " " + msg.getSender().getLastName(),
            msg.getSender().getProfilePhoto(),
            msg.getReceiverId(),
            msg.getConversationId(),
            msg.isRead(),
            msg.getTimestamp(),
            msg.getFileUrl()
        );
    }
}
