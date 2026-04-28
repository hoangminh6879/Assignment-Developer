package com.example.HomestayDev.dto;

import com.example.HomestayDev.model.enums.UpgradeRequestStatus;
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
public class UpgradeRequestDto {
    private UUID id;
    private UUID userId;
    private String username;
    private String email;
    private UpgradeRequestStatus status;
    private String userNote;
    private String proofUrl;
    private String adminNote;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
