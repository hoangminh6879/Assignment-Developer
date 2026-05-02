package com.example.HomestayDev.service;

import com.example.HomestayDev.dto.ChatMessageDto;
import com.example.HomestayDev.dto.UserDto;
import com.example.HomestayDev.model.ChatMessage;
import com.example.HomestayDev.model.User;
import com.example.HomestayDev.repository.ChatMessageRepository;
import com.example.HomestayDev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    @Transactional
    public ChatMessageDto sendMessage(UUID senderKeycloakId, UUID recipientId, String content) {
        User sender = userRepository.findByKeycloakId(senderKeycloakId)
                .orElseThrow(() -> new RuntimeException("Sender not found for Keycloak ID: " + senderKeycloakId));
        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new RuntimeException("Recipient not found: " + recipientId));

        ChatMessage message = ChatMessage.builder()
                .sender(sender)
                .recipient(recipient)
                .content(content)
                .isRead(false)
                .build();

        ChatMessage saved = chatMessageRepository.save(message);
        return mapToDto(saved);
    }

    public List<ChatMessageDto> getConversation(UUID userKeycloakId, UUID otherUserId) {
        User currentUser = userRepository.findByKeycloakId(userKeycloakId)
                .orElseThrow(() -> new RuntimeException("User not found for Keycloak ID: " + userKeycloakId));
        
        List<ChatMessage> messages = chatMessageRepository.findConversation(currentUser.getId(), otherUserId);
        
        // Mark as read
        messages.stream()
                .filter(m -> m.getRecipient().getId().equals(currentUser.getId()) && !m.isRead())
                .forEach(m -> {
                    m.setRead(true);
                    chatMessageRepository.save(m);
                });

        return messages.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public List<UserDto> getContacts(UUID userKeycloakId) {
        User currentUser = userRepository.findByKeycloakId(userKeycloakId)
                .orElseThrow(() -> new RuntimeException("User not found for Keycloak ID: " + userKeycloakId));
        
        List<User> contacts = chatMessageRepository.findContactedUsers(currentUser.getId());
        
        // Also add Admin to contacts if not already there
        // Assuming admin has a specific username or we can find by role
        // For simplicity, let's just return the contacted users for now.
        
        return contacts.stream().map(this::mapUserToDto).collect(Collectors.toList());
    }

    public List<UserDto> searchUsers(String query) {
        return userRepository.findByUsernameContainingIgnoreCase(query).stream()
                .map(this::mapUserToDto)
                .collect(Collectors.toList());
    }

    public UserDto getAdminUser() {
        // Find first user with ADMIN role or specific admin username
        return userRepository.findAll().stream()
                .filter(u -> u.getEmail().equals("admin@gmail.com") || u.getUsername().equals("admin"))
                .findFirst()
                .map(this::mapUserToDto)
                .orElse(null);
    }

    private ChatMessageDto mapToDto(ChatMessage m) {
        return ChatMessageDto.builder()
                .id(m.getId())
                .senderId(m.getSender().getId())
                .senderName(m.getSender().getUsername())
                .recipientId(m.getRecipient().getId())
                .recipientName(m.getRecipient().getUsername())
                .content(m.getContent())
                .timestamp(m.getTimestamp())
                .isRead(m.isRead())
                .build();
    }

    private UserDto mapUserToDto(User u) {
        return UserDto.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .firstName(u.getFirstName())
                .lastName(u.getLastName())
                .avatarUrl(u.getAvatarUrl())
                .build();
    }
}
