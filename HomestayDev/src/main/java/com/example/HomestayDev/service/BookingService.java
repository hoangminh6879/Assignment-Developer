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
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.TaskService;
import org.camunda.bpm.engine.task.Task;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
    private final NotificationService notificationService;
    private final VoucherService voucherService;
    private final WalletService walletService;
    private final RuntimeService runtimeService;
    private final TaskService taskService;

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

        BigDecimal discountAmount = BigDecimal.ZERO;
        if (request.getVoucherCode() != null && !request.getVoucherCode().isEmpty()) {
            discountAmount = voucherService.calculateDiscount(request.getVoucherCode(), totalPrice, homestay.getHost().getId());
            totalPrice = totalPrice.subtract(discountAmount);
        }

        String checkInCode = java.util.UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        Booking booking = Booking.builder()
                .user(user)
                .homestay(homestay)
                .room(room)
                .checkInDate(request.getCheckInDate())
                .checkOutDate(request.getCheckOutDate())
                .totalPrice(totalPrice)
                .discountAmount(discountAmount)
                .appliedVoucherCode(request.getVoucherCode())
                .status(BookingStatus.PENDING)
                .paymentStatus(PaymentStatus.UNPAID)
                .paymentMethod(PaymentMethod.valueOf(request.getPaymentMethod()))
                .checkInCode(checkInCode)
                .build();

        if (booking.getPaymentMethod() == PaymentMethod.WALLET) {
            // Giữ tiền User, nhưng chưa cộng cho Host. Host sẽ nhận tiền khi phê duyệt đơn.
            walletService.holdPayment(user.getId(), totalPrice, "Thanh to\u00e1n \u0111\u1eb7t ph\u00f2ng " + homestay.getName());
            booking.setPaymentStatus(PaymentStatus.PAID);
            // Trạng thái vẫn là PENDING, chờ Host duyệt
        }

        Booking savedBooking = bookingRepository.save(booking);

        if (request.getVoucherCode() != null && !request.getVoucherCode().isEmpty()) {
            voucherService.incrementUsedCount(request.getVoucherCode());
        }

        // Notify Host
        notificationService.createNotification(
                homestay.getHost().getUsername(),
                "\ud83c\udfe0 B\u1ea1n c\u00f3 \u0111\u01a1n \u0111\u1eb7t ph\u00f2ng m\u1edbi t\u1eeb " + user.getUsername() + " cho " + homestay.getName()
                        + " (Kh\u00e1ch \u0111\u00e3 thanh to\u00e1n - ch\u1edd b\u1ea1n duy\u1ec7t trong 3 gi\u1edd)",
                "BOOKING",
                savedBooking.getId().toString()
        );

        // START CAMUNDA PROCESS
        java.util.Map<String, Object> variables = new java.util.HashMap<>();
        variables.put("bookingId", savedBooking.getId().toString());
        variables.put("paymentMethod", savedBooking.getPaymentMethod().name());
        variables.put("hostUsername", homestay.getHost().getUsername());
        variables.put("userUsername", user.getUsername());
        
        runtimeService.startProcessInstanceByKey("homestay-booking-process", savedBooking.getId().toString(), variables);

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
                .filter(b -> b.getStatus() != BookingStatus.CHECKED_IN)
                // Chỉ hiển thị đơn đã thanh toán (PAID hoặc REFUNDED - cần duyệt hoặc đã xử lý)
                .filter(b -> b.getPaymentStatus() == PaymentStatus.PAID
                        || b.getPaymentStatus() == PaymentStatus.REFUNDED)
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

        // Cộng tiền cho Host khi phê duyệt đơn đã thanh toán (WALLET hoặc VNPAY)
        if (booking.getPaymentStatus() == PaymentStatus.PAID) {
            User host = booking.getHomestay().getHost();
            User user = booking.getUser();
            walletService.releaseToHost(
                    host.getId(),
                    booking.getTotalPrice(),
                    "Doanh thu t\u1eeb \u0111\u01a1n \u0111\u1eb7t ph\u00f2ng c\u1ee7a " + user.getUsername() + " t\u1ea1i " + booking.getHomestay().getName()
            );
        }

        // Cập nhật trạng thái phòng: Đã đặt
        Room room = booking.getRoom();
        if (room != null) {
            room.setStatus(RoomStatus.BOOKED);
            roomRepository.save(room);
        }

        bookingRepository.save(booking);

        // Notify User
        notificationService.createNotification(
                booking.getUser().getUsername(),
                "✅ Đơn đặt phòng tại " + booking.getHomestay().getName() + " đã được chủ nhà xác nhận!",
                "BOOKING",
                booking.getId().toString()
        );

        // CAMUNDA: Complete Host Approval Task
        Task task = taskService.createTaskQuery()
                .processInstanceBusinessKey(booking.getId().toString())
                .taskDefinitionKey("Task_HostApproval")
                .singleResult();
        if (task != null) {
            java.util.Map<String, Object> vars = new java.util.HashMap<>();
            vars.put("isApproved", true);
            taskService.complete(task.getId(), vars);
        }

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

        BookingStatus oldStatus = booking.getStatus();
        booking.setStatus(BookingStatus.CANCELLED);
        
        // Trả phòng về trạng thái Sẵn sàng nếu đơn bị hủy
        Room room = booking.getRoom();
        if (room != null) {
            room.setStatus(RoomStatus.AVAILABLE);
            roomRepository.save(room);
        }

        // Hoàn tiền nếu đơn đã thanh toán (WALLET hoặc VNPAY)
        boolean wasRefunded = false;
        if (booking.getPaymentStatus() == PaymentStatus.PAID) {
            if (oldStatus == BookingStatus.CONFIRMED) {
                // Trừ tiền từ Host vì Host đã nhận tiền khi CONFIRMED
                User host = booking.getHomestay().getHost();
                walletService.deductFromHost(
                        host.getId(),
                        booking.getTotalPrice(),
                        "Thu h\u1ed3i doanh thu t\u1eeb \u0111\u01a1n \u0111\u00e3 x\u00e1c nh\u1eadn b\u1ecb h\u1ee7y t\u1ea1i " + booking.getHomestay().getName()
                );
            }

            // Hoàn tiền cho User
            String reason = isHost
                    ? "Ch\u1ee7 nh\u00e0 t\u1eeb ch\u1ed1i \u0111\u01a1n - Ho\u00e0n ti\u1ec1n \u0111\u1eb7t ph\u00f2ng t\u1ea1i " + booking.getHomestay().getName()
                    : "H\u1ee7y \u0111\u01a1n \u0111\u1eb7t ph\u00f2ng t\u1ea1i " + booking.getHomestay().getName();
            walletService.refundToWallet(booking.getUser().getId(), booking.getTotalPrice(), reason);
            booking.setPaymentStatus(PaymentStatus.REFUNDED);
            wasRefunded = true;
        }
        
        Booking saved = bookingRepository.save(booking);

        // Notify
        if (isHost) {
            // Thông báo cho khách
            String userMsg = wasRefunded
                    ? "🚨 Ch\u1ee7 nh\u00e0 \u0111\u00e3 t\u1eeb ch\u1ed1i \u0111\u01a1n \u0111\u1eb7t ph\u00f2ng t\u1ea1i " + booking.getHomestay().getName()
                        + ". S\u1ed1 ti\u1ec1n " + formatVND(booking.getTotalPrice()) + "\u0111 \u0111\u00e3 \u0111\u01b0\u1ee3c ho\u00e0n v\u00e0o V\u00ed c\u1ee7a b\u1ea1n."
                    : "🚨 Ch\u1ee7 nh\u00e0 \u0111\u00e3 t\u1eeb ch\u1ed1i \u0111\u01a1n \u0111\u1eb7t ph\u00f2ng t\u1ea1i " + booking.getHomestay().getName();
            notificationService.createNotification(booking.getUser().getUsername(), userMsg, "BOOKING", saved.getId().toString());
        } else {
            // Thông báo cho host
            notificationService.createNotification(
                    booking.getHomestay().getHost().getUsername(),
                    "\ud83d\udea8 Kh\u00e1ch h\u00e0ng " + username + " \u0111\u00e3 h\u1ee7y \u0111\u01a1n \u0111\u1eb7t ph\u00f2ng t\u1ea1i " + booking.getHomestay().getName(),
                    "BOOKING",
                    saved.getId().toString()
            );
        }

        // CAMUNDA: Complete Host Approval Task with rejection OR Trigger Message Boundary Event
        Task task = taskService.createTaskQuery()
                .processInstanceBusinessKey(saved.getId().toString())
                .taskDefinitionKey("Task_HostApproval")
                .singleResult();
        if (isHost && task != null) {
            java.util.Map<String, Object> vars = new java.util.HashMap<>();
            vars.put("isApproved", false);
            taskService.complete(task.getId(), vars);
        } else {
            // Trigger Manual Cancel Message
            try {
                runtimeService.createMessageCorrelation("CancelBookingMessage")
                        .processInstanceBusinessKey(saved.getId().toString())
                        .correlate();
            } catch (Exception e) {
                System.err.println("[Camunda] Could not correlate CancelBookingMessage: " + e.getMessage());
            }
        }

        return mapToDto(saved);
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

        Booking saved = bookingRepository.save(booking);

        // Notify User
        notificationService.createNotification(
                booking.getUser().getUsername(),
                "B\u1ea1n \u0111\u00e3 nh\u1eadn ph\u00f2ng th\u00e0nh c\u00f4ng t\u1ea1i " + booking.getHomestay().getName(),
                "BOOKING",
                booking.getId().toString()
        );

        // CAMUNDA: Complete Wait Check-In Task
        Task task = taskService.createTaskQuery()
                .processInstanceBusinessKey(booking.getId().toString())
                .taskDefinitionKey("Task_WaitCheckIn")
                .singleResult();
        if (task != null) {
            taskService.complete(task.getId());
        }

        return mapToDto(saved);
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

        // Mọi đơn đến giai đoạn CHECKED_IN đều đã được thanh toán trước - không cần xử lý thanh toán tại quầy nữa
        booking.setStatus(BookingStatus.COMPLETED);

        Room room = booking.getRoom();
        if (room != null) {
            room.setStatus(RoomStatus.AVAILABLE);
            roomRepository.save(room);
        }

        Booking saved = bookingRepository.save(booking);

        // Notify User
        notificationService.createNotification(
                booking.getUser().getUsername(),
                "C\u1ea3m \u01a1n b\u1ea1n \u0111\u00e3 l\u01b0u tr\u00fa t\u1ea1i " + booking.getHomestay().getName() + ". Ch\u00fac b\u1ea1n m\u1ed9t ng\u00e0y t\u1ed1t l\u00e0nh!",
                "BOOKING",
                booking.getId().toString()
        );

        // CAMUNDA: Complete Wait Check-Out Task
        Task task = taskService.createTaskQuery()
                .processInstanceBusinessKey(booking.getId().toString())
                .taskDefinitionKey("Task_WaitCheckOut")
                .singleResult();
        if (task != null) {
            taskService.complete(task.getId());
        }

        return mapToDto(saved);
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

    // ===== CAMUNDA DELEGATE HANDLERS =====

    @Transactional
    public void handleAutoCancelVNPay(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking != null && booking.getStatus() == BookingStatus.PENDING && booking.getPaymentStatus() == PaymentStatus.UNPAID) {
            booking.setStatus(BookingStatus.CANCELLED);
            Room room = booking.getRoom();
            if (room != null) {
                room.setStatus(RoomStatus.AVAILABLE);
                roomRepository.save(room);
            }
            bookingRepository.save(booking);
            System.out.println("[Camunda] Auto-canceled VNPay booking: " + bookingId);
        }
    }

    @Transactional
    public void handleAutoCancelUnapproved(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking != null && booking.getStatus() == BookingStatus.PENDING && booking.getPaymentStatus() == PaymentStatus.PAID) {
            booking.setStatus(BookingStatus.CANCELLED);
            booking.setPaymentStatus(PaymentStatus.REFUNDED);

            Room room = booking.getRoom();
            if (room != null) {
                room.setStatus(RoomStatus.AVAILABLE);
                roomRepository.save(room);
            }

            // Hoàn tiền vào Ví của khách
            walletService.refundToWallet(
                    booking.getUser().getId(),
                    booking.getTotalPrice(),
                    "Hoàn tiền tự động: Chủ nhà không duyệt đơn đặt phòng tại " + booking.getHomestay().getName() + " trong 3 giờ"
            );

            bookingRepository.save(booking);

            // Thông báo cho User (khách)
            notificationService.createNotification(
                    booking.getUser().getUsername(),
                    "\ud83d\udd14 \u0110\u01a1n \u0111\u1eb7t ph\u00f2ng t\u1ea1i " + booking.getHomestay().getName()
                            + " \u0111\u00e3 b\u1ecb h\u1ee7y t\u1ef1 \u0111\u1ed9ng v\u00ec ch\u1ee7 nh\u00e0 kh\u00f4ng duy\u1ec7t trong 3 gi\u1edd. "
                            + "S\u1ed1 ti\u1ec1n " + formatVND(booking.getTotalPrice()) + "\u0111 \u0111\u00e3 \u0111\u01b0\u1ee3c ho\u00e0n v\u00e0o V\u00ed c\u1ee7a b\u1ea1n.",
                    "BOOKING",
                    booking.getId().toString()
            );

            // Thông báo cho Host
            notificationService.createNotification(
                    booking.getHomestay().getHost().getUsername(),
                    "⚠️ Đơn đặt phòng của " + booking.getUser().getUsername() + " tại " + booking.getHomestay().getName()
                            + " đã bị hủy tự động do quá thời gian duyệt (3 giờ). Tiền đã được hoàn lại cho khách.",
                    "BOOKING",
                    booking.getId().toString()
            );

            System.out.println("[Camunda] Auto-canceled unapproved paid booking: " + bookingId);
        }
    }

    private BookingDto mapToDto(Booking booking) {
        return BookingDto.builder()
                .id(booking.getId())
                .checkInDate(booking.getCheckInDate())
                .checkOutDate(booking.getCheckOutDate())
                .totalPrice(booking.getTotalPrice())
                .discountAmount(booking.getDiscountAmount())
                .appliedVoucherCode(booking.getAppliedVoucherCode())
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
                .hostId(booking.getHomestay().getHost().getId())
                .hostName(booking.getHomestay().getHost().getUsername())
                .review(booking.getReview() != null ? reviewService.mapToDto(booking.getReview()) : null)
                .build();
    }

    private String formatVND(BigDecimal amount) {
        if (amount == null) return "0";
        return String.format("%,.0f", amount.doubleValue());
    }
}
