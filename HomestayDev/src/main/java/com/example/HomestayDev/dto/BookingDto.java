package com.example.HomestayDev.dto;

import com.example.HomestayDev.model.enums.BookingStatus;
import com.example.HomestayDev.model.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingDto {
    private UUID id;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private BigDecimal totalPrice;
    private BookingStatus status;
    private PaymentStatus paymentStatus;
    private String paymentMethod;
    private LocalDateTime createdAt;
    private String checkInCode;
    
    private UUID homestayId;
    private String homestayName;
    private UUID roomId;
    private String roomName;
    private String roomTypeName;
    
    private UUID userId;
    private String userName;

    private UUID hostId;
    private String hostName;

    private ReviewDto review;
}
