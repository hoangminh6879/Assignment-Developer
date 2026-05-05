package com.example.HomestayDev.repository;

import com.example.HomestayDev.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {
    List<Booking> findByUserId(UUID userId);
    List<Booking> findByHomestayHostUsername(String username);
    
    @Query("SELECT b FROM Booking b WHERE b.room.id = :roomId " +
           "AND b.status <> 'CANCELLED' " +
           "AND ((b.checkInDate <= :endDate AND b.checkOutDate >= :startDate))")
    List<Booking> findOverlappingBookings(@Param("roomId") UUID roomId, 
                                          @Param("startDate") LocalDate startDate, 
                                          @Param("endDate") LocalDate endDate);

    @Query("SELECT b FROM Booking b WHERE b.status = 'PENDING' AND b.paymentMethod = 'VNPAY' AND b.paymentStatus = 'UNPAID' AND b.createdAt < :timeLimit")
    List<Booking> findExpiredVNPayBookings(@Param("timeLimit") java.time.LocalDateTime timeLimit);

    @Query("SELECT b FROM Booking b WHERE b.status = 'PENDING' AND b.paymentStatus = 'PAID' AND b.createdAt < :timeLimit")
    List<Booking> findExpiredPaidPendingBookings(@Param("timeLimit") java.time.LocalDateTime timeLimit);

    java.util.Optional<Booking> findByCheckInCode(String checkInCode);

    // --- Statistics Queries ---

    @Query("SELECT SUM(b.totalPrice) FROM Booking b WHERE b.status = 'COMPLETED'")
    java.math.BigDecimal getTotalRevenueAdmin();

    @Query("SELECT b.status, COUNT(b) FROM Booking b GROUP BY b.status")
    List<Object[]> getBookingStatusCountsAdmin();

    @Query("SELECT h.name, COUNT(b), SUM(b.totalPrice) FROM Booking b JOIN b.homestay h WHERE b.status = 'COMPLETED' GROUP BY h.id, h.name ORDER BY SUM(b.totalPrice) DESC")
    List<Object[]> getTopHomestaysAdmin();

    @Query("SELECT SUM(b.totalPrice) FROM Booking b WHERE b.homestay.host.username = :username AND b.status = 'COMPLETED'")
    java.math.BigDecimal getTotalRevenueHost(@Param("username") String username);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.homestay.host.username = :username")
    Long getTotalBookingsHost(@Param("username") String username);

    @Query("SELECT h.name, COUNT(b), SUM(b.totalPrice) FROM Booking b JOIN b.homestay h WHERE h.host.username = :username AND b.status = 'COMPLETED' GROUP BY h.id, h.name")
    List<Object[]> getHomestayStatsHost(@Param("username") String username);

    @Query("SELECT SUBSTRING(CAST(b.createdAt AS string), 1, 7) as m, SUM(b.totalPrice) FROM Booking b WHERE b.status = 'COMPLETED' GROUP BY m ORDER BY m ASC")
    List<Object[]> getMonthlyRevenueAdmin();

    @Query("SELECT SUBSTRING(CAST(b.createdAt AS string), 1, 7) as m, SUM(b.totalPrice) FROM Booking b WHERE b.homestay.host.username = :username AND b.status = 'COMPLETED' GROUP BY m ORDER BY m ASC")
    List<Object[]> getMonthlyRevenueHost(@Param("username") String username);
    @Query("SELECT b FROM Booking b WHERE b.homestay.host.username = :username AND b.createdAt BETWEEN :startDate AND :endDate")
    List<Booking> findByHostAndDateRange(@Param("username") String username, @Param("startDate") java.time.LocalDateTime startDate, @Param("endDate") java.time.LocalDateTime endDate);

    @Query("SELECT b FROM Booking b WHERE b.createdAt BETWEEN :startDate AND :endDate")
    List<Booking> findAllByDateRange(@Param("startDate") java.time.LocalDateTime startDate, @Param("endDate") java.time.LocalDateTime endDate);
}
