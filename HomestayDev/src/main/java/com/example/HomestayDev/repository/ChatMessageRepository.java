package com.example.HomestayDev.repository;

import com.example.HomestayDev.model.ChatMessage;
import com.example.HomestayDev.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    @Query("SELECT m FROM ChatMessage m WHERE " +
            "(m.sender.id = :u1 AND m.recipient.id = :u2) OR " +
            "(m.sender.id = :u2 AND m.recipient.id = :u1) " +
            "ORDER BY m.timestamp ASC")
    List<ChatMessage> findConversation(@Param("u1") UUID user1Id, @Param("u2") UUID user2Id);

    @Query("SELECT m FROM ChatMessage m WHERE m.recipient.id = :userId AND m.isRead = false")
    List<ChatMessage> findUnreadMessages(@Param("userId") UUID userId);

    @Query("SELECT DISTINCT u FROM User u WHERE u.id IN (" +
            "SELECT m.recipient.id FROM ChatMessage m WHERE m.sender.id = :userId UNION " +
            "SELECT m.sender.id FROM ChatMessage m WHERE m.recipient.id = :userId)")
    List<User> findContactedUsers(@Param("userId") UUID userId);
}
