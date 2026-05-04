package com.example.HomestayDev.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class NotificationDto {
    private UUID id;
    private String message;
    private String type;
    private boolean isRead;
    private LocalDateTime createdAt;
    private String targetId;
}
