package com.example.HomestayDev.service;

import com.example.HomestayDev.config.VNPayConfig;
import com.example.HomestayDev.model.Booking;
import com.example.HomestayDev.model.Payment;
import com.example.HomestayDev.model.enums.PaymentStatus;
import com.example.HomestayDev.repository.BookingRepository;
import com.example.HomestayDev.repository.PaymentRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.camunda.bpm.engine.RuntimeService;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final VNPayConfig vnPayConfig;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final RuntimeService runtimeService;

    public String createVNPayUrl(UUID bookingId, HttpServletRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getPaymentStatus() == PaymentStatus.PAID) {
            throw new RuntimeException("Booking is already paid");
        }

        long amount = booking.getTotalPrice().longValue() * 100; // VNPay format is * 100
        String vnp_TxnRef = VNPayConfig.getRandomNumber(8) + "-" + bookingId.toString();

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", VNPayConfig.vnp_Version);
        vnp_Params.put("vnp_Command", VNPayConfig.vnp_Command);
        vnp_Params.put("vnp_TmnCode", vnPayConfig.getVnp_TmnCode());
        vnp_Params.put("vnp_Amount", String.valueOf(amount));
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_OrderInfo", "Thanh toan don hang:" + bookingId);
        vnp_Params.put("vnp_OrderType", "other");
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_ReturnUrl", vnPayConfig.getVnp_ReturnUrl());
        vnp_Params.put("vnp_IpAddr", VNPayConfig.getIpAddress(request));

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String vnp_CreateDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

        cld.add(Calendar.MINUTE, 15);
        String vnp_ExpireDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnp_Params.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII));
                query.append('=');
                query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }
        String queryUrl = query.toString();
        String vnp_SecureHash = VNPayConfig.hmacSHA512(vnPayConfig.getVnp_HashSecret(), hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;
        return vnPayConfig.getVnp_PayUrl() + "?" + queryUrl;
    }

    /**
     * Xử lý kết quả trả về từ VNPay — chỉ lưu DB trong @Transactional này.
     * Camunda correlation được gọi riêng bằng correlateVNPayMessage() SAU KHI
     * transaction commit.
     *
     * @return bookingId nếu thanh toán thành công, null nếu thất bại
     */
    @Transactional
    public UUID processPaymentReturn(Map<String, String> params) {
        Map<String, String> fields = new HashMap<>(params);
        String secureHash = fields.get("vnp_SecureHash");
        fields.remove("vnp_SecureHashType");
        fields.remove("vnp_SecureHash");

        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = fields.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                if (itr.hasNext()) {
                    hashData.append('&');
                }
            }
        }

        String checkSum = VNPayConfig.hmacSHA512(vnPayConfig.getVnp_HashSecret(), hashData.toString());

        if (!checkSum.equals(secureHash)) {
            return null; // Sai chữ ký → từ chối
        }

        if (!"00".equals(fields.get("vnp_ResponseCode"))) {
            return null; // Thanh toán thất bại phía VNPay
        }

        String txnRef = fields.get("vnp_TxnRef");
        String[] parts = txnRef.split("-", 2);
        if (parts.length < 2)
            return null;

        UUID bookingId = UUID.fromString(parts[1]);
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getPaymentStatus() != PaymentStatus.UNPAID) {
            // Duplicate callback — đã xử lý rồi
            return bookingId;
        }

        booking.setPaymentStatus(PaymentStatus.PAID);
        bookingRepository.save(booking);

        Payment payment = Payment.builder()
                .amount(booking.getTotalPrice())
                .paymentMethod("VNPAY")
                .transactionId(fields.get("vnp_TransactionNo"))
                .status("SUCCESS")
                .booking(booking)
                .build();
        paymentRepository.save(payment);

        // Thông báo cho Host
        notificationService.createNotification(
                booking.getHomestay().getHost().getUsername(),
                "🏠 Khách hàng " + booking.getUser().getUsername()
                        + " đã thanh toán thành công qua VNPay cho đơn đặt phòng tại "
                        + booking.getHomestay().getName()
                        + ". Hãy duyệt đơn trong vòng 3 giờ, nếu không đơn sẽ tự động bị hủy và hoàn tiền cho khách.",
                "BOOKING",
                booking.getId().toString());

        // Thông báo cho khách
        notificationService.createNotification(
                booking.getUser().getUsername(),
                "✅ Thanh toán VNPay thành công cho đơn đặt phòng tại "
                        + booking.getHomestay().getName()
                        + ". Đơn đang chờ chủ nhà xác nhận (tối đa 3 giờ).",
                "BOOKING",
                booking.getId().toString());

        return bookingId;
    }

    /**
     * Correlate Camunda Message SAU KHI transaction DB đã commit thành công.
     * KHÔNG có @Transactional để không lây exception vào transaction payment.
     */
    public void correlateVNPayMessage(UUID bookingId) {
        try {
            runtimeService.createMessageCorrelation("Message_VNPaySuccess")
                    .processInstanceBusinessKey(bookingId.toString())
                    .correlate();
            System.out.println("[Camunda] Correlated Message_VNPaySuccess for booking: " + bookingId);
        } catch (Exception e) {
            System.err.println("[Camunda] Could not correlate Message_VNPaySuccess for booking "
                    + bookingId + ": " + e.getMessage());
        }
    }
}
