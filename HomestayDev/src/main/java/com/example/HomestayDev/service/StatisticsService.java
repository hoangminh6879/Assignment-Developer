package com.example.HomestayDev.service;

import com.example.HomestayDev.dto.StatisticsDto;
import com.example.HomestayDev.repository.BookingRepository;
import com.example.HomestayDev.repository.HomestayRepository;
import com.example.HomestayDev.repository.ReviewRepository;
import com.example.HomestayDev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final BookingRepository bookingRepository;
    private final HomestayRepository homestayRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;

    public StatisticsDto.AdminStatistics getAdminStatistics() {
        BigDecimal totalRevenue = bookingRepository.getTotalRevenueAdmin();
        if (totalRevenue == null) totalRevenue = BigDecimal.ZERO;

        Long totalBookings = bookingRepository.count();
        Long totalHomestays = homestayRepository.count();
        Long totalUsers = userRepository.count();

        List<Object[]> statusCountsRaw = bookingRepository.getBookingStatusCountsAdmin();
        Map<String, Long> statusCounts = new HashMap<>();
        if (statusCountsRaw != null) {
            for (Object[] row : statusCountsRaw) {
                if (row != null && row.length >= 2 && row[0] != null) {
                    statusCounts.put(row[0].toString(), row[1] != null ? ((Number) row[1]).longValue() : 0L);
                }
            }
        }

        List<Object[]> monthlyRevenueRaw = bookingRepository.getMonthlyRevenueAdmin();
        List<StatisticsDto.MonthlyRevenue> monthlyRevenue = monthlyRevenueRaw != null ? monthlyRevenueRaw.stream()
                .map(row -> {
                    String month = row[0] != null ? row[0].toString() : "Unknown";
                    BigDecimal rev = row[1] != null ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO;
                    return new StatisticsDto.MonthlyRevenue(month, rev);
                })
                .collect(Collectors.toList()) : List.of();

        List<Object[]> topHomestaysRaw = bookingRepository.getTopHomestaysAdmin();
        List<StatisticsDto.HomestayStats> topHomestays = topHomestaysRaw != null ? topHomestaysRaw.stream()
                .limit(5)
                .map(row -> {
                    String name = row[0] != null ? row[0].toString() : "Unknown";
                    Long count = row[1] != null ? ((Number) row[1]).longValue() : 0L;
                    BigDecimal rev = row[2] != null ? new BigDecimal(row[2].toString()) : BigDecimal.ZERO;
                    return new StatisticsDto.HomestayStats(name, count, rev);
                })
                .collect(Collectors.toList()) : List.of();

        return StatisticsDto.AdminStatistics.builder()
                .totalRevenue(totalRevenue)
                .totalBookings(totalBookings)
                .totalHomestays(totalHomestays)
                .totalUsers(totalUsers)
                .bookingsByStatus(statusCounts)
                .monthlyRevenue(monthlyRevenue)
                .topHomestays(topHomestays)
                .build();
    }

    public StatisticsDto.HostStatistics getHostStatistics(String username) {
        BigDecimal totalRevenue = bookingRepository.getTotalRevenueHost(username);
        if (totalRevenue == null) totalRevenue = BigDecimal.ZERO;

        Long totalBookings = bookingRepository.getTotalBookingsHost(username);
        Long totalHomestays = homestayRepository.countByHostUsername(username);

        List<Object[]> monthlyRevenueRaw = bookingRepository.getMonthlyRevenueHost(username);
        List<StatisticsDto.MonthlyRevenue> monthlyRevenue = monthlyRevenueRaw != null ? monthlyRevenueRaw.stream()
                .map(row -> {
                    String month = row[0] != null ? row[0].toString() : "Unknown";
                    BigDecimal rev = row[1] != null ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO;
                    return new StatisticsDto.MonthlyRevenue(month, rev);
                })
                .collect(Collectors.toList()) : List.of();

        List<Object[]> homestayStatsRaw = bookingRepository.getHomestayStatsHost(username);
        List<StatisticsDto.HomestayStats> homestayStats = homestayStatsRaw != null ? homestayStatsRaw.stream()
                .map(row -> {
                    String name = row[0] != null ? row[0].toString() : "Unknown";
                    Long count = row[1] != null ? ((Number) row[1]).longValue() : 0L;
                    BigDecimal rev = row[2] != null ? new BigDecimal(row[2].toString()) : BigDecimal.ZERO;
                    return new StatisticsDto.HomestayStats(name, count, rev);
                })
                .collect(Collectors.toList()) : List.of();

        Double averageRating = reviewRepository.getAverageRatingForHost(username);
        Long totalReviews = reviewRepository.countReviewsForHost(username);

        return StatisticsDto.HostStatistics.builder()
                .totalRevenue(totalRevenue)
                .totalBookings(totalBookings != null ? totalBookings : 0L)
                .totalHomestays(totalHomestays != null ? totalHomestays : 0L)
                .monthlyRevenue(monthlyRevenue)
                .homestayStats(homestayStats)
                .averageRating(averageRating != null ? averageRating : 0.0)
                .totalReviews(totalReviews != null ? totalReviews : 0L)
                .build();
    }
}
