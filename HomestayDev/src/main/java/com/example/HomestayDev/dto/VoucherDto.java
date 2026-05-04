package com.example.HomestayDev.dto;

import com.example.HomestayDev.model.enums.VoucherType;
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
public class VoucherDto {
    private UUID id;
    private String code;
    private VoucherType type;
    private BigDecimal value;
    private BigDecimal minBookingAmount;
    private BigDecimal maxDiscountAmount;
    private LocalDate expiryDate;
    private Integer usageLimit;
    private Integer usedCount;
    @com.fasterxml.jackson.annotation.JsonProperty("isGlobal")
    private boolean isGlobal;
    private UUID hostId;
    private String hostName;
    @com.fasterxml.jackson.annotation.JsonProperty("isActive")
    private boolean isActive;
    private LocalDateTime createdAt;
}
