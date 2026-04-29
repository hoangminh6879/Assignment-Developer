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
    
    @Query("SELECT b FROM Booking b WHERE b.room.id = :roomId " +
           "AND b.status <> 'CANCELLED' " +
           "AND ((b.checkInDate <= :endDate AND b.checkOutDate >= :startDate))")
    List<Booking> findOverlappingBookings(@Param("roomId") UUID roomId, 
                                          @Param("startDate") LocalDate startDate, 
                                          @Param("endDate") LocalDate endDate);

    @Query("SELECT b FROM Booking b WHERE b.status = 'PENDING' AND b.paymentMethod = 'VNPAY' AND b.paymentStatus = 'UNPAID' AND b.createdAt < :timeLimit")
    List<Booking> findExpiredVNPayBookings(@Param("timeLimit") java.time.LocalDateTime timeLimit);

    java.util.Optional<Booking> findByCheckInCode(String checkInCode);
}
