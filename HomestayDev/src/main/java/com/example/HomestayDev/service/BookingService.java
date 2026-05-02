package com.example.HomestayDev.service;

import com.example.HomestayDev.dto.BookingDto;
import com.example.HomestayDev.dto.BookingRequestDto;
import com.example.HomestayDev.dto.CheckoutRequestDto;
import com.example.HomestayDev.dto.ReviewDto;
import com.example.HomestayDev.model.*;
import com.example.HomestayDev.model.enums.BookingStatus;
import com.example.HomestayDev.model.enums.PaymentMethod;
import com.example.HomestayDev.model.enums.PaymentStatus;
import com.example.HomestayDev.model.enums.RoomStatus;
import com.example.HomestayDev.repository.BookingRepository;
import com.example.HomestayDev.repository.HomestayRepository;
import com.example.HomestayDev.repository.RoomRepository;
import com.example.HomestayDev.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.scheduling.annotation.Scheduled;

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
    private final EmailService emailService;
    private final ReviewService reviewService;

    @Transactional
    public BookingDto createBooking(String username, BookingRequestDto request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Homestay homestay = homestayRepository.findById(request.getHomestayId())
                .orElseThrow(() -> new RuntimeException("Homestay not found"));

        if (!homestay.getStatus().name().equals("ACTIVE")) {
            throw new RuntimeException("Homestay này hiện đang tạm ngưng hoặc chưa được phê duyệt, không thể đặt phòng.");
        }

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

        String checkInCode = java.util.UUID.randomUUID().toString().substring(0, 6).toUpperCase();

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
                .checkInCode(checkInCode)
                .build();

        Booking savedBooking = bookingRepository.save(booking);

        return mapToDto(savedBooking);
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
        
        return bookingRepository.findAll().stream()
                .filter(b -> b.getHomestay().getHost().getId().equals(host.getId()))
                // Không hiển thị CHECKED_IN ở tab này (chúng được quản lý ở tab check-in)
                .filter(b -> b.getStatus() != BookingStatus.CHECKED_IN)
                .filter(b -> {
                    if (b.getPaymentMethod() == PaymentMethod.VNPAY) {
                        return b.getPaymentStatus() == PaymentStatus.PAID;
                    }
                    return true;
                })
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<BookingDto> getCheckedInBookings(String hostUsername) {
        User host = userRepository.findByUsername(hostUsername)
                .orElseThrow(() -> new RuntimeException("Host not found"));

        return bookingRepository.findAll().stream()
                .filter(b -> b.getHomestay().getHost().getId().equals(host.getId()))
                .filter(b -> b.getStatus() == BookingStatus.CHECKED_IN)
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

        // Cập nhật trạng thái phòng: Đã đặt
        Room room = booking.getRoom();
        if (room != null) {
            room.setStatus(RoomStatus.BOOKED);
            roomRepository.save(room);
        }

        bookingRepository.save(booking);

        return mapToDto(booking);
    }

    // Gửi email SAU khi transaction đã commit (gọi riêng, không trong @Transactional)
    public void sendConfirmationEmail(UUID bookingId) {
        try {
            Booking booking = bookingRepository.findById(bookingId).orElse(null);
            if (booking != null) {
                emailService.sendBookingConfirmation(booking);
            }
        } catch (Exception e) {
            System.err.println("[Email] Failed to send confirmation email for booking " + bookingId);
            e.printStackTrace();
        }
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
        
        // Trả phòng về trạng thái Sẵn sàng nếu đơn bị hủy
        Room room = booking.getRoom();
        if (room != null) {
            room.setStatus(RoomStatus.AVAILABLE);
            roomRepository.save(room);
        }
        
        return mapToDto(bookingRepository.save(booking));
    }

    public Booking getBookingByCheckInCode(String code) {
        return bookingRepository.findByCheckInCode(code.toUpperCase())
                .orElseThrow(() -> new RuntimeException("Check-in code not found or invalid"));
    }

    public List<BookingDto> getBookingsByCitizenId(String citizenId, String hostUsername) {
        User host = userRepository.findByUsername(hostUsername)
                .orElseThrow(() -> new RuntimeException("Host not found"));

        return bookingRepository.findAll().stream()
                .filter(b -> b.getHomestay().getHost().getId().equals(host.getId()))
                .filter(b -> b.getUser().getCitizenId() != null && b.getUser().getCitizenId().equals(citizenId))
                .filter(b -> b.getStatus() == BookingStatus.PENDING || b.getStatus() == BookingStatus.CONFIRMED)
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public BookingDto confirmCheckIn(UUID bookingId, String hostUsername) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getHomestay().getHost().getUsername().equals(hostUsername)) {
            throw new RuntimeException("You are not the host of this homestay");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new RuntimeException("Booking is cancelled");
        }

        if (booking.getStatus() == BookingStatus.CHECKED_IN) {
            throw new RuntimeException("Booking is already checked in");
        }

        // Ràng buộc: Chỉ được check-in từ ngày nhận phòng trở đi
        LocalDate today = LocalDate.now();
        if (today.isBefore(booking.getCheckInDate())) {
            throw new RuntimeException("Chưa đến ngày nhận phòng. Ngày check-in theo đơn là: " + booking.getCheckInDate());
        }

        booking.setStatus(BookingStatus.CHECKED_IN);

        // Trạng thái phòng vẫn là BOOKED trong suốt quá trình khách ở
        Room room = booking.getRoom();
        if (room != null) {
            room.setStatus(RoomStatus.BOOKED);
            roomRepository.save(room);
        }

        return mapToDto(bookingRepository.save(booking));
    }

    @Transactional
    public BookingDto checkout(UUID bookingId, CheckoutRequestDto request, String hostUsername) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getHomestay().getHost().getUsername().equals(hostUsername)) {
            throw new RuntimeException("You are not the host of this homestay");
        }

        if (booking.getStatus() != BookingStatus.CHECKED_IN) {
            throw new RuntimeException("Booking is not in CHECKED_IN status");
        }

        // Ràng buộc: Chỉ được checkout sau ngày nhận phòng trong đơn
        LocalDate today = LocalDate.now();
        if (!today.isAfter(booking.getCheckInDate())) {
            throw new RuntimeException("Ngày checkout phải sau ngày nhận phòng trong đơn ("
                    + booking.getCheckInDate() + "). Vui lòng thực hiện checkout vào ngày "
                    + booking.getCheckInDate().plusDays(1) + " hoặc sau đó.");
        }

        String userCitizenId = booking.getUser().getCitizenId();
        if (userCitizenId == null || !userCitizenId.equals(request.getCitizenId())) {
            throw new RuntimeException("CCCD/CMND không khớp với thông tin đơn đặt phòng");
        }

        if (booking.getPaymentStatus() == PaymentStatus.UNPAID) {
            if (!request.isConfirmPayment()) {
                throw new RuntimeException("Đơn hàng chưa thanh toán. Vui lòng xác nhận thanh toán để checkout.");
            }
            booking.setPaymentStatus(PaymentStatus.PAID);
        }

        booking.setStatus(BookingStatus.COMPLETED);

        Room room = booking.getRoom();
        if (room != null) {
            room.setStatus(RoomStatus.AVAILABLE);
            roomRepository.save(room);
        }

        return mapToDto(bookingRepository.save(booking));
    }

    public BookingDto mapToDtoPublic(Booking booking) {
        return mapToDto(booking);
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

    @Scheduled(fixedRate = 60000) // Run every 60 seconds
    @Transactional
    public void autoCancelExpiredVNPayBookings() {
        java.time.LocalDateTime oneHourAgo = java.time.LocalDateTime.now().minusHours(1);
        List<Booking> expiredBookings = bookingRepository.findExpiredVNPayBookings(oneHourAgo);
        
        for (Booking booking : expiredBookings) {
            booking.setStatus(BookingStatus.CANCELLED);
            
            // Giải phóng phòng về trạng thái Sẵn sàng
            Room room = booking.getRoom();
            if (room != null) {
                room.setStatus(RoomStatus.AVAILABLE);
                roomRepository.save(room);
            }
        }
        
        if (!expiredBookings.isEmpty()) {
            bookingRepository.saveAll(expiredBookings);
            System.out.println("Auto-cancelled " + expiredBookings.size() + " expired VNPay bookings and released rooms.");
        }
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
                .checkInCode(booking.getCheckInCode())
                .homestayId(booking.getHomestay().getId())
                .homestayName(booking.getHomestay().getName())
                .roomId(booking.getRoom().getId())
                .roomName(booking.getRoom().getName())
                .roomTypeName(booking.getRoom().getRoomType().getName())
                .userId(booking.getUser().getId())
                .userName(booking.getUser().getUsername())
                .review(booking.getReview() != null ? reviewService.mapToDto(booking.getReview()) : null)
                .build();
    }
}
