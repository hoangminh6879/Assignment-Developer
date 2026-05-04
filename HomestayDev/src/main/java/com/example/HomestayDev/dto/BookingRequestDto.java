package com.example.HomestayDev.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingRequestDto {
    private UUID homestayId;
    private UUID roomId;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private String paymentMethod;
    private String voucherCode;
}
