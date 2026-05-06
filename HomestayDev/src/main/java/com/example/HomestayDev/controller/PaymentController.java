package com.example.HomestayDev.controller;

import com.example.HomestayDev.dto.PaymentResponseDto;
import com.example.HomestayDev.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping("/create-vnpay")
    public ResponseEntity<PaymentResponseDto> createVNPayPayment(
            @RequestParam UUID bookingId,
            HttpServletRequest request) {

        String vnpayUrl = paymentService.createVNPayUrl(bookingId, request);

        return ResponseEntity.ok(PaymentResponseDto.builder()
                .status("OK")
                .message("Successfully created payment URL")
                .url(vnpayUrl)
                .build());
    }

    @GetMapping("/vnpay-return")
    public void vnpayReturn(
            @RequestParam Map<String, String> params,
            HttpServletResponse response) throws IOException {

        // processPaymentReturn() chỉ lưu DB, trả về bookingId nếu thành công
        UUID bookingId = paymentService.processPaymentReturn(params);

        if (bookingId != null) {
            // Gọi Camunda correlation SAU KHI transaction DB đã commit thành công
            // → tránh UnexpectedRollbackException
            paymentService.correlateVNPayMessage(bookingId);
            response.sendRedirect("http://localhost:4200/payment/result?status=success");
        } else {
            response.sendRedirect("http://localhost:4200/payment/result?status=failed");
        }
    }
}
