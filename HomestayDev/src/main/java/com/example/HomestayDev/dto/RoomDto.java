package com.example.HomestayDev.dto;

import com.example.HomestayDev.model.enums.RoomStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomDto {
    private UUID id;
    private String name;
    private Long roomTypeId;
    private String roomTypeName;
    private BigDecimal priceExtra;
    private Integer maxGuests;
    private RoomStatus status;
    private UUID homestayId;
    private List<HomestayImageDto> images;
}
