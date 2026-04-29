package com.example.HomestayDev.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaymentResponseDto {
    private String status;
    private String message;
    private String url;
}
