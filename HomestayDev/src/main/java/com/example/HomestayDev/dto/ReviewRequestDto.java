package com.example.HomestayDev.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewRequestDto {
    private UUID bookingId;
    private Integer rating;
    private String comment;
}
