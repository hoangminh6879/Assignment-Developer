package com.example.HomestayDev.service;

import com.example.HomestayDev.dto.StatisticsDto;
import com.example.HomestayDev.repository.BookingRepository;
import com.example.HomestayDev.repository.HomestayRepository;
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

    public StatisticsDto.AdminStatistics getAdminStatistics() {
        BigDecimal totalRevenue = bookingRepository.getTotalRevenueAdmin();
        if (totalRevenue == null) totalRevenue = BigDecimal.ZERO;

        Long totalBookings = bookingRepository.count();
        Long totalHomestays = homestayRepository.count();
        Long totalUsers = userRepository.count();

        List<Object[]> statusCountsRaw = bookingRepository.getBookingStatusCountsAdmin();
        Map<String, Long> statusCounts = new HashMap<>();
        for (Object[] row : statusCountsRaw) {
            statusCounts.put(row[0].toString(), (Long) row[1]);
        }

        List<Object[]> monthlyRevenueRaw = bookingRepository.getMonthlyRevenueAdmin();
        List<StatisticsDto.MonthlyRevenue> monthlyRevenue = monthlyRevenueRaw.stream()
                .map(row -> new StatisticsDto.MonthlyRevenue((String) row[0], (BigDecimal) row[1]))
                .collect(Collectors.toList());

        List<Object[]> topHomestaysRaw = bookingRepository.getTopHomestaysAdmin();
        List<StatisticsDto.HomestayStats> topHomestays = topHomestaysRaw.stream()
                .limit(5)
                .map(row -> new StatisticsDto.HomestayStats((String) row[0], (Long) row[1], (BigDecimal) row[2]))
                .collect(Collectors.toList());

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
        List<StatisticsDto.MonthlyRevenue> monthlyRevenue = monthlyRevenueRaw.stream()
                .map(row -> new StatisticsDto.MonthlyRevenue((String) row[0], (BigDecimal) row[1]))
                .collect(Collectors.toList());

        List<Object[]> homestayStatsRaw = bookingRepository.getHomestayStatsHost(username);
        List<StatisticsDto.HomestayStats> homestayStats = homestayStatsRaw.stream()
                .map(row -> new StatisticsDto.HomestayStats((String) row[0], (Long) row[1], (BigDecimal) row[2]))
                .collect(Collectors.toList());

        return StatisticsDto.HostStatistics.builder()
                .totalRevenue(totalRevenue)
                .totalBookings(totalBookings)
                .totalHomestays(totalHomestays)
                .monthlyRevenue(monthlyRevenue)
                .homestayStats(homestayStats)
                .build();
    }
}
