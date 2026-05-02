package com.example.HomestayDev.controller;

import com.example.HomestayDev.dto.ChatMessageDto;
import com.example.HomestayDev.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping("/history/{otherUserId}")
    public ResponseEntity<?> getHistory(Authentication authentication, @PathVariable UUID otherUserId) {
        org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken jwtAuth = 
                (org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken) authentication;
        UUID userKeycloakId = java.util.UUID.fromString(jwtAuth.getToken().getSubject());
        return ResponseEntity.ok(chatService.getConversation(userKeycloakId, otherUserId));
    }

    @GetMapping("/contacts")
    public ResponseEntity<?> getContacts(Authentication authentication) {
        org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken jwtAuth = 
                (org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken) authentication;
        UUID userKeycloakId = java.util.UUID.fromString(jwtAuth.getToken().getSubject());
        return ResponseEntity.ok(chatService.getContacts(userKeycloakId));
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchUsers(@RequestParam String query) {
        return ResponseEntity.ok(chatService.searchUsers(query));
    }

    @GetMapping("/admin-user")
    public ResponseEntity<?> getAdminUser() {
        return ResponseEntity.ok(chatService.getAdminUser());
    }

    @PostMapping("/send")
    public ResponseEntity<?> sendRestMessage(Authentication authentication, @RequestBody ChatMessageDto messageDto) {
        try {
            // Extract the Keycloak 'sub' (UUID) directly from the JWT
            org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken jwtAuth = 
                    (org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken) authentication;
            UUID senderKeycloakId = java.util.UUID.fromString(jwtAuth.getToken().getSubject());
            
            // Save to DB
            ChatMessageDto saved = chatService.sendMessage(
                    senderKeycloakId, 
                    messageDto.getRecipientId(), 
                    messageDto.getContent()
            );
            
            // Push to recipient in real-time
            messagingTemplate.convertAndSend("/topic/messages/" + saved.getRecipientId().toString(), saved);
            
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            System.err.println("Chat send error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }
}
