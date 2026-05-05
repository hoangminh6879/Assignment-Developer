package com.example.HomestayDev.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@Table(name = "notifications")
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String userId; // Keycloak ID or Username

    @Column(nullable = false, columnDefinition = "nvarchar(1000)")
    @org.hibernate.annotations.JdbcTypeCode(java.sql.Types.NVARCHAR)
    private String message;

    @Column(nullable = false)
    private String type; // e.g., 'BOOKING', 'HOMESTAY', 'CHAT', 'SYSTEM'

    @Column(name = "is_read")
    private boolean read = false;

    private LocalDateTime createdAt = LocalDateTime.now();

    private String targetId; // ID of the related object (e.g., Booking ID)
}
