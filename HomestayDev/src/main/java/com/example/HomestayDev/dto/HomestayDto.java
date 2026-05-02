package com.example.HomestayDev.dto;

import com.example.HomestayDev.model.enums.HomestayStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HomestayDto {
    private UUID id;
    private String name;
    private String description;
    private String address;
    private String city;
    private BigDecimal pricePerNight;
    private Integer maxGuests;
    private HomestayStatus status;
    private String adminReason;
    private LocalDateTime createdAt;
    private Long viewCount;
    
    private UUID hostId;
    private String hostName;
    
    private List<HomestayImageDto> images;
    private List<AmenityDto> amenities;

    private Double averageRating;
    private Integer reviewCount;
}
