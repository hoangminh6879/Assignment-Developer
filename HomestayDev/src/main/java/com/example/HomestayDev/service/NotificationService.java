package com.example.HomestayDev.service;

import com.example.HomestayDev.dto.NotificationDto;
import com.example.HomestayDev.model.Notification;
import com.example.HomestayDev.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;

    public List<NotificationDto> getUserNotifications(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public void markAsRead(UUID id) {
        notificationRepository.findById(id).ifPresent(n -> n.setRead(true));
    }

    @Transactional
    public void markAllAsRead(String userId) {
        notificationRepository.findByUserIdAndReadFalse(userId)
                .forEach(n -> n.setRead(true));
    }

    @Transactional
    public void createNotification(String userId, String message, String type, String targetId) {
        Notification n = new Notification();
        n.setUserId(userId);
        n.setMessage(message);
        n.setType(type);
        n.setTargetId(targetId);
        notificationRepository.save(n);
    }

    private NotificationDto convertToDto(Notification n) {
        NotificationDto dto = new NotificationDto();
        dto.setId(n.getId());
        dto.setMessage(n.getMessage());
        dto.setType(n.getType());
        dto.setRead(n.isRead());
        dto.setCreatedAt(n.getCreatedAt());
        dto.setTargetId(n.getTargetId());
        return dto;
    }
}
