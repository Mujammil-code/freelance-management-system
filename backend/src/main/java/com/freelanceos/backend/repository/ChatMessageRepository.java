package com.freelanceos.backend.repository;

import com.freelanceos.backend.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByConversationIdOrderByTimestampAsc(String conversationId);

    @Query("SELECT DISTINCT c.conversationId FROM ChatMessage c WHERE c.sender.id = :userId OR c.receiverId = :userId")
    List<String> findConversationIdsByUserId(Long userId);

    long countByReceiverIdAndIsReadFalse(Long receiverId);

    @Query("SELECT c FROM ChatMessage c WHERE c.conversationId = :conversationId AND c.receiverId = :userId AND c.isRead = false")
    List<ChatMessage> findUnreadMessagesInConversation(String conversationId, Long userId);
}
