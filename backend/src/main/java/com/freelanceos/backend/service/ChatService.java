package com.freelanceos.backend.service;

import com.freelanceos.backend.dto.ChatMessageDTO;
import com.freelanceos.backend.dto.UserDTO;
import com.freelanceos.backend.entity.ChatMessage;
import com.freelanceos.backend.entity.User;
import com.freelanceos.backend.exception.ResourceNotFoundException;
import com.freelanceos.backend.exception.BadRequestException;
import com.freelanceos.backend.repository.ChatMessageRepository;
import com.freelanceos.backend.repository.UserRepository;
import com.freelanceos.backend.util.SecurityUtils;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

    public ChatService(ChatMessageRepository chatMessageRepository, UserRepository userRepository, SimpMessagingTemplate messagingTemplate) {
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    private User getAuthenticatedUser() {
        User user = SecurityUtils.getCurrentUser();
        if (user == null) {
            throw new BadRequestException("User not authenticated");
        }
        return user;
    }

    private String getConversationId(Long id1, Long id2) {
        return Math.min(id1, id2) + "_" + Math.max(id1, id2);
    }

    @Transactional
    public ChatMessageDTO sendMessage(Long senderId, Long receiverId, String content, String messageType, String fileUrl) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender not found with id: " + senderId));
        String conversationId = getConversationId(sender.getId(), receiverId);

        ChatMessage chatMessage = ChatMessage.builder()
                .content(content)
                .messageType(ChatMessage.MessageType.valueOf(messageType))
                .sender(sender)
                .receiverId(receiverId)
                .conversationId(conversationId)
                .isRead(false)
                .timestamp(LocalDateTime.now())
                .fileUrl(fileUrl)
                .build();

        ChatMessage saved = chatMessageRepository.save(chatMessage);
        ChatMessageDTO dto = ChatMessageDTO.fromEntity(saved);

        // Broadcast to WebSocket subscribers for this conversation
        messagingTemplate.convertAndSend("/topic/conversation/" + conversationId, dto);

        // Check if receiver is the AI Bot (ID 999)
        if (receiverId.equals(999L)) {
            triggerAiBotResponse(conversationId, sender, content);
        }

        return dto;
    }

    private void triggerAiBotResponse(String conversationId, User sender, String userMessage) {
        // Send typing indicator immediately
        scheduler.schedule(() -> {
            Map<String, Object> typingEvent = new HashMap<>();
            typingEvent.put("conversationId", conversationId);
            typingEvent.put("userId", 999L);
            typingEvent.put("isTyping", true);
            messagingTemplate.convertAndSend("/topic/typing/" + conversationId, typingEvent);
        }, 300, TimeUnit.MILLISECONDS);

        // Generate AI reply after 2 seconds
        scheduler.schedule(() -> {
            // Stop typing indicator
            Map<String, Object> typingEvent = new HashMap<>();
            typingEvent.put("conversationId", conversationId);
            typingEvent.put("userId", 999L);
            typingEvent.put("isTyping", false);
            messagingTemplate.convertAndSend("/topic/typing/" + conversationId, typingEvent);

            // Fetch Bot user or mock it
            User bot = User.builder()
                    .id(999L)
                    .firstName("FreelanceOS")
                    .lastName("AI Bot")
                    .email("ai-bot@freelanceos.com")
                    .profilePhoto("ai")
                    .role(User.Role.ADMIN)
                    .build();

            String replyContent = generateBotReply(userMessage);

            ChatMessage reply = ChatMessage.builder()
                    .content(replyContent)
                    .messageType(ChatMessage.MessageType.TEXT)
                    .sender(bot)
                    .receiverId(sender.getId())
                    .conversationId(conversationId)
                    .isRead(false)
                    .timestamp(LocalDateTime.now())
                    .build();

            // Save and broadcast
            ChatMessage savedReply = chatMessageRepository.save(reply);
            messagingTemplate.convertAndSend("/topic/conversation/" + conversationId, ChatMessageDTO.fromEntity(savedReply));

        }, 2200, TimeUnit.MILLISECONDS);
    }

    private String generateBotReply(String msg) {
        String input = msg.toLowerCase();
        if (input.contains("hello") || input.contains("hi")) {
            return "Hello there! I am the FreelanceOS Virtual Assistant. How can I help you manage your business today? You can ask me to: \n- Explain project estimations\n- Draft an invoice sample\n- Check task priorities";
        } else if (input.contains("estimate") || input.contains("project")) {
            return "To get a high-fidelity project timeline, milestones, and risk reports, check out our **AI Estimator** tab in the sidebar! It analyzes complexity, tech stack, and deadline constraints locally.";
        } else if (input.contains("invoice")) {
            return "You can easily generate and preview professional client bills using our **Invoice Module**. Just click '+ New Invoice' in the Top Nav or sidebar dashboard to start.";
        } else if (input.contains("help") || input.contains("how to")) {
            return "FreelanceOS allows you to sync tasks on the Kanban Board, log payments, upload project files, and track client notes. Let me know if you want help with a specific module!";
        } else {
            return "I've recorded that. As your FreelanceOS Assistant, I'll notify you of any upcoming deadlines or outstanding payments. Let me know if you need anything else!";
        }
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDTO> getMessageHistory(String conversationId) {
        User user = getAuthenticatedUser();
        // Validate conversation accessibility
        String[] parts = conversationId.split("_");
        if (parts.length != 2) {
            throw new BadRequestException("Invalid conversation ID");
        }
        Long user1 = Long.parseLong(parts[0]);
        Long user2 = Long.parseLong(parts[1]);
        if (!user.getId().equals(user1) && !user.getId().equals(user2)) {
            throw new BadRequestException("Unauthorized access to this conversation");
        }

        return chatMessageRepository.findByConversationIdOrderByTimestampAsc(conversationId).stream()
                .map(ChatMessageDTO::fromEntity)
                .toList();
    }

    @Transactional
    public void markMessagesAsRead(String conversationId) {
        User user = getAuthenticatedUser();
        List<ChatMessage> unread = chatMessageRepository.findUnreadMessagesInConversation(conversationId, user.getId());
        for (ChatMessage msg : unread) {
            msg.setRead(true);
        }
        chatMessageRepository.saveAll(unread);
    }

    @Transactional(readOnly = true)
    public List<UserDTO> getChatContacts() {
        User currentUser = getAuthenticatedUser();
        boolean isCurrentUserAdmin = currentUser.getRole() == User.Role.ADMIN;

        List<UserDTO> contacts = new java.util.ArrayList<>(userRepository.findAll().stream()
                .filter(u -> !u.getId().equals(currentUser.getId()))
                .filter(u -> isCurrentUserAdmin || u.getRole() == User.Role.ADMIN)
                .map(u -> new UserDTO(u.getId(), u.getFirstName(), u.getLastName(), u.getEmail(),
                        u.getPhone(), u.getBio(), u.getProfilePhoto(), u.getJobTitle(), u.getCompany(),
                        u.getSkills(), u.getSocialLinks(), u.getRole().name()))
                .toList());

        // Append the AI Bot Contact (Only for Admins)
        if (isCurrentUserAdmin) {
            contacts.add(new UserDTO(999L, "FreelanceOS", "AI Bot", "ai-bot@freelanceos.com",
                    null, "Always online Virtual Assistant", "ai", "Assistant", "FreelanceOS",
                    List.of("AI", "Support"), Map.of(), "ADMIN"));
        }

        return contacts;
    }
}
