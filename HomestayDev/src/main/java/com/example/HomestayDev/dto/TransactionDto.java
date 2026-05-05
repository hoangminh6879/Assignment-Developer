package com.example.HomestayDev.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionDto {
    private Long id;
    private BigDecimal amount;
    private String type;
    private String description;
    private BigDecimal balanceAfter;
    private String vnpayTxnRef;
    private LocalDateTime createdAt;
}
