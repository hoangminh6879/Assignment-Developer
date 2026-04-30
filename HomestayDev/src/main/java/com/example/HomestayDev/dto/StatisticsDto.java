package com.example.HomestayDev.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class StatisticsDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminStatistics {
        private BigDecimal totalRevenue;
        private Long totalBookings;
        private Long totalHomestays;
        private Long totalUsers;
        private List<MonthlyRevenue> monthlyRevenue;
        private Map<String, Long> bookingsByStatus;
        private List<HomestayStats> topHomestays;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HostStatistics {
        private BigDecimal totalRevenue;
        private Long totalBookings;
        private Long totalHomestays;
        private List<MonthlyRevenue> monthlyRevenue;
        private List<HomestayStats> homestayStats;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyRevenue {
        private String month; // yyyy-MM
        private BigDecimal revenue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HomestayStats {
        private String homestayName;
        private Long bookingCount;
        private BigDecimal totalRevenue;
    }
}
