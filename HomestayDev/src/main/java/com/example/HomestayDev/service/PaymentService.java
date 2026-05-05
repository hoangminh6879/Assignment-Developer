package com.example.HomestayDev.service;

import com.example.HomestayDev.config.VNPayConfig;
import com.example.HomestayDev.model.Booking;
import com.example.HomestayDev.model.Payment;
import com.example.HomestayDev.model.enums.BookingStatus;
import com.example.HomestayDev.model.enums.PaymentStatus;
import com.example.HomestayDev.repository.BookingRepository;
import com.example.HomestayDev.repository.PaymentRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        
        // Use vnp_TxnRef to store a unique transaction reference along with booking ID
        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        
        // This parameter passes back the booking ID to the return URL for easy processing
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
                //Build hash data
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                //Build query
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

    @Transactional
    public boolean processPaymentReturn(Map<String, String> params) {
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

        if (checkSum.equals(secureHash)) {
            if ("00".equals(fields.get("vnp_ResponseCode"))) {
                // Payment successful
                String txnRef = fields.get("vnp_TxnRef");
                // Split into max 2 parts, so the UUID stays intact
                String[] parts = txnRef.split("-", 2);
                if (parts.length > 1) {
                    try {
                        UUID bookingId = UUID.fromString(parts[1]);
                        Booking booking = bookingRepository.findById(bookingId)
                                .orElseThrow(() -> new RuntimeException("Booking not found"));

                        if (booking.getPaymentStatus() == PaymentStatus.UNPAID) {
                            booking.setPaymentStatus(PaymentStatus.PAID);
                            // Giữ PENDING - Host cần duyệt thủ công trong vòng 3 giờ
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
                                    booking.getId().toString()
                            );

                            // Thông báo cho khách
                            notificationService.createNotification(
                                    booking.getUser().getUsername(),
                                    "✅ Thanh toán VNPay thành công cho đơn đặt phòng tại "
                                            + booking.getHomestay().getName()
                                            + ". Đơn đang chờ chủ nhà xác nhận (tối đa 3 giờ).",
                                    "BOOKING",
                                    booking.getId().toString()
                            );
                        }
                        return true;
                    } catch (Exception e) {
                        e.printStackTrace();
                        return false;
                    }
                }
            }
        }
        return false;
    }
}
