package com.freelanceos.backend.controller;

import com.freelanceos.backend.dto.ChatMessageDTO;
import com.freelanceos.backend.dto.UserDTO;
import com.freelanceos.backend.service.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatController(ChatService chatService, SimpMessagingTemplate messagingTemplate) {
        this.chatService = chatService;
        this.messagingTemplate = messagingTemplate;
    }

    // Handles WebSocket STOMP messages received at /app/chat.send
    @MessageMapping("/chat.send")
    public void receiveWebSocketMessage(@Payload Map<String, Object> payload) {
        Long senderId = Long.parseLong(payload.get("senderId").toString());
        Long receiverId = Long.parseLong(payload.get("receiverId").toString());
        String content = payload.get("content").toString();
        String messageType = payload.getOrDefault("messageType", "TEXT").toString();
        String fileUrl = payload.get("fileUrl") != null ? payload.get("fileUrl").toString() : null;

        // Message is saved and broadcast internally inside ChatService
        chatService.sendMessage(senderId, receiverId, content, messageType, fileUrl);
    }

    // Handles WebSocket typing events at /app/chat.typing
    @MessageMapping("/chat.typing")
    public void receiveTypingIndicator(@Payload Map<String, Object> payload) {
        String conversationId = payload.get("conversationId").toString();
        // Broadcast typing indicator directly to subscribers
        messagingTemplate.convertAndSend("/topic/typing/" + conversationId, payload);
    }

    @GetMapping("/api/chat/messages/{conversationId}")
    public ResponseEntity<List<ChatMessageDTO>> getMessageHistory(@PathVariable String conversationId) {
        return ResponseEntity.ok(chatService.getMessageHistory(conversationId));
    }

    @PatchMapping("/api/chat/messages/{conversationId}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable String conversationId) {
        chatService.markMessagesAsRead(conversationId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/chat/contacts")
    public ResponseEntity<List<UserDTO>> getChatContacts() {
        return ResponseEntity.ok(chatService.getChatContacts());
    }

    // Fallback REST endpoint for sending messages
    @PostMapping("/api/chat/messages/{receiverId}")
    public ResponseEntity<ChatMessageDTO> sendHttpMessage(@PathVariable Long receiverId, @RequestBody SendMessageRequest request) {
        Long senderId = com.freelanceos.backend.util.SecurityUtils.getCurrentUserId();
        if (senderId == null) {
            throw new com.freelanceos.backend.exception.BadRequestException("User not authenticated");
        }
        return ResponseEntity.ok(chatService.sendMessage(senderId, receiverId, request.content(), "TEXT", null));
    }

    public record SendMessageRequest(String content) {}
}
