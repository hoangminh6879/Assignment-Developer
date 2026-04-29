package com.example.HomestayDev.service;

import com.example.HomestayDev.dto.BookingDto;
import com.example.HomestayDev.dto.BookingRequestDto;
import com.example.HomestayDev.model.*;
import com.example.HomestayDev.model.enums.BookingStatus;
import com.example.HomestayDev.model.enums.PaymentMethod;
import com.example.HomestayDev.model.enums.PaymentStatus;
import com.example.HomestayDev.repository.BookingRepository;
import com.example.HomestayDev.repository.HomestayRepository;
import com.example.HomestayDev.repository.RoomRepository;
import com.example.HomestayDev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final HomestayRepository homestayRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;

    @Transactional
    public BookingDto createBooking(String username, BookingRequestDto request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Homestay homestay = homestayRepository.findById(request.getHomestayId())
                .orElseThrow(() -> new RuntimeException("Homestay not found"));

        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (!room.getHomestay().getId().equals(homestay.getId())) {
            throw new RuntimeException("Room does not belong to this homestay");
        }

        // Validate dates
        if (request.getCheckInDate().isBefore(LocalDate.now())) {
            throw new RuntimeException("Check-in date cannot be in the past");
        }
        if (!request.getCheckOutDate().isAfter(request.getCheckInDate())) {
            throw new RuntimeException("Check-out date must be after check-in date");
        }

        // Check availability
        List<Booking> overlapping = bookingRepository.findOverlappingBookings(
                room.getId(), request.getCheckInDate(), request.getCheckOutDate());
        
        if (!overlapping.isEmpty()) {
            throw new RuntimeException("Room is not available for the selected dates");
        }

        // Calculate price
        long nights = ChronoUnit.DAYS.between(request.getCheckInDate(), request.getCheckOutDate());
        BigDecimal pricePerNight = homestay.getPricePerNight().add(room.getPriceExtra());
        BigDecimal totalPrice = pricePerNight.multiply(BigDecimal.valueOf(nights));

        Booking booking = Booking.builder()
                .user(user)
                .homestay(homestay)
                .room(room)
                .checkInDate(request.getCheckInDate())
                .checkOutDate(request.getCheckOutDate())
                .totalPrice(totalPrice)
                .status(BookingStatus.PENDING)
                .paymentStatus(PaymentStatus.UNPAID)
                .paymentMethod(PaymentMethod.valueOf(request.getPaymentMethod()))
                .build();

        return mapToDto(bookingRepository.save(booking));
    }

    public List<BookingDto> getMyBookings(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return bookingRepository.findByUserId(user.getId()).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<BookingDto> getAllBookings() {
        return bookingRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<BookingDto> getHostBookings(String username) {
        User host = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Host not found"));
        
        // Find bookings for homestays owned by this host
        return bookingRepository.findAll().stream()
                .filter(b -> b.getHomestay().getHost().getId().equals(host.getId()))
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public BookingDto approveBooking(UUID bookingId, String hostUsername) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        if (!booking.getHomestay().getHost().getUsername().equals(hostUsername)) {
            throw new RuntimeException("You are not the host of this homestay");
        }

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new RuntimeException("Booking is not in PENDING status");
        }

        booking.setStatus(BookingStatus.CONFIRMED);
        return mapToDto(bookingRepository.save(booking));
    }

    @Transactional
    public BookingDto cancelBooking(UUID bookingId, String username) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // User can cancel their own booking, or Host can reject/cancel
        boolean isOwner = booking.getUser().getUsername().equals(username);
        boolean isHost = booking.getHomestay().getHost().getUsername().equals(username);

        if (!isOwner && !isHost) {
            throw new RuntimeException("You are not authorized to cancel this booking");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new RuntimeException("Booking is already cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        return mapToDto(bookingRepository.save(booking));
    }

    public List<Room> getAvailableRooms(UUID homestayId, Long roomTypeId, LocalDate checkIn, LocalDate checkOut) {
        List<Room> allRooms = roomRepository.findByHomestayId(homestayId);
        
        return allRooms.stream()
                .filter(room -> room.getRoomType().getId().equals(roomTypeId))
                .filter(room -> {
                    List<Booking> overlapping = bookingRepository.findOverlappingBookings(room.getId(), checkIn, checkOut);
                    return overlapping.isEmpty();
                })
                .collect(Collectors.toList());
    }

    private BookingDto mapToDto(Booking booking) {
        return BookingDto.builder()
                .id(booking.getId())
                .checkInDate(booking.getCheckInDate())
                .checkOutDate(booking.getCheckOutDate())
                .totalPrice(booking.getTotalPrice())
                .status(booking.getStatus())
                .paymentStatus(booking.getPaymentStatus())
                .paymentMethod(booking.getPaymentMethod() != null ? booking.getPaymentMethod().name() : null)
                .createdAt(booking.getCreatedAt())
                .homestayId(booking.getHomestay().getId())
                .homestayName(booking.getHomestay().getName())
                .roomId(booking.getRoom().getId())
                .roomName(booking.getRoom().getName())
                .roomTypeName(booking.getRoom().getRoomType().getName())
                .userId(booking.getUser().getId())
                .userName(booking.getUser().getUsername())
                .build();
    }
}
