package com.example.HomestayDev.controller;

import com.example.HomestayDev.dto.BookingDto;
import com.example.HomestayDev.dto.BookingRequestDto;
import com.example.HomestayDev.dto.CheckoutRequestDto;
import com.example.HomestayDev.dto.RoomDto;
import com.example.HomestayDev.model.Booking;
import com.example.HomestayDev.model.Room;
import com.example.HomestayDev.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<BookingDto> createBooking(
            Authentication authentication,
            @RequestBody BookingRequestDto request) {
        return ResponseEntity.ok(bookingService.createBooking(authentication.getName(), request));
    }

    @GetMapping("/my")
    public ResponseEntity<List<BookingDto>> getMyBookings(Authentication authentication) {
        return ResponseEntity.ok(bookingService.getMyBookings(authentication.getName()));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BookingDto>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    @GetMapping("/host")
    @PreAuthorize("hasRole('HOST')")
    public ResponseEntity<List<BookingDto>> getHostBookings(Authentication authentication) {
        return ResponseEntity.ok(bookingService.getHostBookings(authentication.getName()));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('HOST')")
    public ResponseEntity<BookingDto> approveBooking(
            Authentication authentication,
            @PathVariable UUID id) {
        BookingDto result = bookingService.approveBooking(id, authentication.getName());
        // Gửi email sau khi transaction đã commit thành công
        bookingService.sendConfirmationEmail(id);
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<BookingDto> cancelBooking(
            Authentication authentication,
            @PathVariable UUID id) {
        return ResponseEntity.ok(bookingService.cancelBooking(id, authentication.getName()));
    }

    @GetMapping("/check-in/{code}")
    @PreAuthorize("hasRole('HOST')")
    public ResponseEntity<BookingDto> getBookingByCheckInCode(@PathVariable String code) {
        Booking booking = bookingService.getBookingByCheckInCode(code);
        return ResponseEntity.ok(bookingService.mapToDtoPublic(booking));
    }

    @GetMapping("/check-in/cccd/{citizenId}")
    @PreAuthorize("hasRole('HOST')")
    public ResponseEntity<List<BookingDto>> getBookingsByCitizenId(
            Authentication authentication,
            @PathVariable String citizenId) {
        return ResponseEntity.ok(bookingService.getBookingsByCitizenId(citizenId, authentication.getName()));
    }

    @PutMapping("/{id}/check-in")
    @PreAuthorize("hasRole('HOST')")
    public ResponseEntity<BookingDto> confirmCheckIn(
            Authentication authentication,
            @PathVariable UUID id) {
        return ResponseEntity.ok(bookingService.confirmCheckIn(id, authentication.getName()));
    }

    @GetMapping("/host/checked-in")
    @PreAuthorize("hasRole('HOST')")
    public ResponseEntity<List<BookingDto>> getCheckedInBookings(Authentication authentication) {
        return ResponseEntity.ok(bookingService.getCheckedInBookings(authentication.getName()));
    }

    @PutMapping("/{id}/checkout")
    @PreAuthorize("hasRole('HOST')")
    public ResponseEntity<BookingDto> checkout(
            Authentication authentication,
            @PathVariable UUID id,
            @RequestBody CheckoutRequestDto request) {
        return ResponseEntity.ok(bookingService.checkout(id, request, authentication.getName()));
    }

    @GetMapping("/available-rooms")
    public ResponseEntity<List<RoomDto>> getAvailableRooms(
            @RequestParam UUID homestayId,
            @RequestParam Long roomTypeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut) {
        
        List<Room> available = bookingService.getAvailableRooms(homestayId, roomTypeId, checkIn, checkOut);
        
        // Map to DTO - I'll need to use RoomService.mapToDto but it's private. 
        // For simplicity, I'll map it here or make it public.
        // Actually, I'll just map a simplified version or reuse the RoomDto if possible.
        return ResponseEntity.ok(available.stream().map(room -> RoomDto.builder()
                .id(room.getId())
                .name(room.getName())
                .roomTypeId(room.getRoomType().getId())
                .roomTypeName(room.getRoomType().getName())
                .priceExtra(room.getPriceExtra())
                .maxGuests(room.getMaxGuests())
                .status(room.getStatus())
                .homestayId(room.getHomestay().getId())
                .build()).collect(Collectors.toList()));
    }
}
