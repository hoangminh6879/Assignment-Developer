package com.example.HomestayDev.service;

import com.example.HomestayDev.model.Booking;
import com.example.HomestayDev.model.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendBookingConfirmation(Booking booking) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(booking.getUser().getEmail());
            helper.setSubject("Xác nhận đặt phòng tại " + booking.getHomestay().getName());

            String htmlMsg = buildEmailContent(booking);
            helper.setText(htmlMsg, true);

            mailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Failed to send email to: " + booking.getUser().getEmail());
            e.printStackTrace();
        } catch (Exception e) {
            System.err.println("Exception in sending email");
            e.printStackTrace();
        }
    }

    private String buildEmailContent(Booking booking) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        String checkIn = booking.getCheckInDate().format(formatter);
        String checkOut = booking.getCheckOutDate().format(formatter);
        String price = String.format("%,d", booking.getTotalPrice().longValue());

        return "<div style=\"font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);\">"
                + "<div style=\"background-color: #4f46e5; padding: 30px 20px; text-align: center;\">"
                + "  <h1 style=\"color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;\">Xác Nhận Đặt Phòng</h1>"
                + "  <p style=\"color: #e0e7ff; margin: 10px 0 0; font-size: 15px;\">Cảm ơn bạn đã tin tưởng và lựa chọn hệ thống của chúng tôi!</p>"
                + "</div>"
                + "<div style=\"padding: 30px; background-color: #ffffff;\">"
                + "  <p style=\"font-size: 16px; color: #374151; margin-top: 0;\">Xin chào <strong>" + booking.getUser().getFirstName() + " " + booking.getUser().getLastName() + "</strong>,</p>"
                + "  <p style=\"font-size: 15px; color: #4b5563; line-height: 1.6;\">Đơn đặt phòng của bạn tại <strong>" + booking.getHomestay().getName() + "</strong> đã được xác nhận thành công.</p>"
                + "  <div style=\"background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 25px 0;\">"
                + "    <h3 style=\"margin: 0 0 15px; color: #1f2937; font-size: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;\">Chi tiết đơn hàng</h3>"
                + "    <table style=\"width: 100%; border-collapse: collapse;\">"
                + "      <tr><td style=\"padding: 8px 0; color: #6b7280; font-size: 14px; width: 40%;\">Loại phòng:</td><td style=\"padding: 8px 0; color: #111827; font-weight: 500; font-size: 14px;\">" + booking.getRoom().getRoomType().getName() + " - " + booking.getRoom().getName() + "</td></tr>"
                + "      <tr><td style=\"padding: 8px 0; color: #6b7280; font-size: 14px;\">Ngày nhận phòng:</td><td style=\"padding: 8px 0; color: #111827; font-weight: 500; font-size: 14px;\">" + checkIn + "</td></tr>"
                + "      <tr><td style=\"padding: 8px 0; color: #6b7280; font-size: 14px;\">Ngày trả phòng:</td><td style=\"padding: 8px 0; color: #111827; font-weight: 500; font-size: 14px;\">" + checkOut + "</td></tr>"
                + "      <tr><td style=\"padding: 12px 0 0; color: #6b7280; font-size: 15px; border-top: 1px solid #e5e7eb; font-weight: 600;\">Tổng tiền:</td><td style=\"padding: 12px 0 0; color: #ef4444; font-weight: 700; font-size: 18px; border-top: 1px solid #e5e7eb;\">" + price + " VNĐ</td></tr>"
                + "    </table>"
                + "  </div>"
                + "  <div style=\"text-align: center; margin: 35px 0 20px;\">"
                + "    <p style=\"margin: 0 0 10px; color: #6b7280; font-size: 14px; text-transform: uppercase; font-weight: 600; letter-spacing: 1px;\">Mã Nhận Phòng Của Bạn</p>"
                + "    <div style=\"display: inline-block; background: linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%); padding: 15px 30px; border-radius: 12px; border: 2px dashed #6366f1; box-shadow: 0 4px 6px rgba(99,102,241,0.1);\">"
                + "      <span style=\"color: #4f46e5; font-size: 32px; font-weight: 800; letter-spacing: 4px;\">" + booking.getCheckInCode() + "</span>"
                + "    </div>"
                + "    <p style=\"margin: 15px 0 0; color: #9ca3af; font-size: 13px;\">Vui lòng cung cấp mã này cho chủ nhà khi bạn đến nhận phòng.</p>"
                + "  </div>"
                + "</div>"
                + "<div style=\"background-color: #f3f4f6; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;\">"
                + "  <p style=\"margin: 0; color: #6b7280; font-size: 13px;\">Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi.</p>"
                + "  <p style=\"margin: 5px 0 0; color: #9ca3af; font-size: 12px;\">&copy; 2026 Homestay System. All rights reserved.</p>"
                + "</div>"
                + "</div>";
    }

    public void sendUpgradeApprovalEmail(User user) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(user.getEmail());
            helper.setSubject("🎉 Chúc mừng! Yêu cầu nâng cấp tài khoản Host đã được phê duyệt");
            String html = "<div style=\"font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;border-radius:12px;overflow:hidden;\">"
                    + "<div style=\"background:linear-gradient(135deg,#10b981,#059669);padding:30px 20px;text-align:center;\">"
                    + "  <h1 style=\"color:#fff;margin:0;font-size:24px;\">🏡 Tài Khoản Host Được Phê Duyệt!</h1>"
                    + "</div>"
                    + "<div style=\"padding:30px;background:#fff;\">"
                    + "  <p style=\"font-size:16px;color:#374151;\">Xin chào <strong>" + user.getFirstName() + " " + user.getLastName() + "</strong>,</p>"
                    + "  <p style=\"font-size:15px;color:#4b5563;line-height:1.6;\">Chúng tôi vui mừng thông báo rằng yêu cầu nâng cấp tài khoản lên <strong>Host</strong> của bạn đã được <strong style=\"color:#10b981;\">PHÊ DUYỆT</strong>.</p>"
                    + "  <p style=\"font-size:15px;color:#4b5563;line-height:1.6;\">Từ bây giờ, bạn có thể đăng ký homestay và bắt đầu cho thuê trên nền tảng của chúng tôi.</p>"
                    + "  <div style=\"text-align:center;margin:30px 0;\">"
                    + "    <a href=\"http://localhost:4200/dashboard\" style=\"background:#10b981;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;\">Truy cập Dashboard Host</a>"
                    + "  </div>"
                    + "</div>"
                    + "<div style=\"background:#f3f4f6;padding:20px;text-align:center;\">"
                    + "  <p style=\"margin:0;color:#6b7280;font-size:13px;\">© 2026 Homestay System. All rights reserved.</p>"
                    + "</div></div>";
            helper.setText(html, true);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send upgrade approval email: " + e.getMessage());
        }
    }

    public void sendUpgradeRejectionEmail(User user, String adminNote) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(user.getEmail());
            helper.setSubject("Thông báo về yêu cầu nâng cấp tài khoản Host");
            String noteHtml = (adminNote != null && !adminNote.isBlank())
                    ? "<div style=\"background:#fef2f2;border-left:4px solid #ef4444;padding:15px;border-radius:4px;margin:20px 0;\">"
                      + "<p style=\"margin:0;color:#991b1b;font-size:14px;\"><strong>Lý do từ Admin:</strong> " + adminNote + "</p></div>"
                    : "";
            String html = "<div style=\"font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;border-radius:12px;overflow:hidden;\">"
                    + "<div style=\"background:linear-gradient(135deg,#6b7280,#4b5563);padding:30px 20px;text-align:center;\">"
                    + "  <h1 style=\"color:#fff;margin:0;font-size:24px;\">Yêu Cầu Nâng Cấp Tài Khoản</h1>"
                    + "</div>"
                    + "<div style=\"padding:30px;background:#fff;\">"
                    + "  <p style=\"font-size:16px;color:#374151;\">Xin chào <strong>" + user.getFirstName() + " " + user.getLastName() + "</strong>,</p>"
                    + "  <p style=\"font-size:15px;color:#4b5563;line-height:1.6;\">Rất tiếc, yêu cầu nâng cấp tài khoản lên Host của bạn đã <strong style=\"color:#ef4444;\">KHÔNG ĐƯỢC PHÊ DUYỆT</strong> lần này.</p>"
                    + noteHtml
                    + "  <p style=\"font-size:15px;color:#4b5563;line-height:1.6;\">Bạn có thể cập nhật thông tin và gửi lại yêu cầu sau khi đã bổ sung đầy đủ tài liệu cần thiết.</p>"
                    + "</div>"
                    + "<div style=\"background:#f3f4f6;padding:20px;text-align:center;\">"
                    + "  <p style=\"margin:0;color:#6b7280;font-size:13px;\">© 2026 Homestay System. All rights reserved.</p>"
                    + "</div></div>";
            helper.setText(html, true);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send upgrade rejection email: " + e.getMessage());
        }
    }
}

