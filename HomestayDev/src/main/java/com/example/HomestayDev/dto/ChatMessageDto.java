package com.example.HomestayDev.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageDto {
    private UUID id;
    private UUID senderId;
    private String senderName;
    private UUID recipientId;
    private String recipientName;
    private String content;
    private LocalDateTime timestamp;
    private Boolean isRead;
}
