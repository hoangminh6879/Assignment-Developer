package com.example.HomestayDev.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewDto {
    private UUID id;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
    private String response;
    private LocalDateTime responseCreatedAt;
    
    private String userFullName;
    private String userUsername;
    private List<String> imageUrls;
    private UUID bookingId;
    private UUID homestayId;
    private String homestayName;
}
