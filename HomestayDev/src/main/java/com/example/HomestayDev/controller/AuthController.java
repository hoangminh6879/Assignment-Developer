package com.example.HomestayDev.controller;

import com.example.HomestayDev.dto.AuthResponse;
import com.example.HomestayDev.dto.ForgotPasswordRequest;
import com.example.HomestayDev.dto.LoginRequest;
import com.example.HomestayDev.dto.RefreshTokenRequest;
import com.example.HomestayDev.dto.RegistrationRequest;
import com.example.HomestayDev.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController {

    private final AuthService authService;

    /**
     * Đăng ký tài khoản mới.
     * Sau khi tạo thành công, Keycloak tự gửi email xác thực (Verify Email feature).
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegistrationRequest request) {
        try {
            return ResponseEntity.ok(authService.register(request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Đăng nhập bằng username hoặc email (Keycloak Login with Email).
     * Hỗ trợ Remember Me (offline_access scope).
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (AuthService.EmailNotVerifiedException e) {
            // Lỗi đặc biệt: tài khoản chưa xác thực email
            return ResponseEntity.status(403).body(Map.of(
                    "message", e.getMessage(),
                    "error_code", "EMAIL_NOT_VERIFIED"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Quên mật khẩu — Keycloak gửi email đặt lại mật khẩu (Forgot Password feature).
     * Luôn trả 200 OK để không tiết lộ email có tồn tại hay không.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        try {
            authService.forgotPassword(request.getEmail());
        } catch (Exception e) {
            // Log nội bộ nhưng không để lộ lỗi ra ngoài
        }
        return ResponseEntity.ok(Map.of(
                "message", "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu."
        ));
    }

    /**
     * Làm mới access token bằng refresh token.
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestBody RefreshTokenRequest request) {
        try {
            AuthResponse response = authService.refreshToken(request.getRefreshToken());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Đăng xuất — revoke refresh token phía Keycloak.
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody RefreshTokenRequest request) {
        try {
            authService.logout(request.getRefreshToken());
            return ResponseEntity.ok(Map.of("message", "Đăng xuất thành công."));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Gửi lại email xác thực — dành cho tài khoản cũ chưa verify.
     * Nhận username hoặc email.
     */
    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerification(@RequestBody Map<String, String> body) {
        String usernameOrEmail = body.get("usernameOrEmail");
        if (usernameOrEmail == null || usernameOrEmail.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng cung cấp username hoặc email."));
        }
        try {
            authService.resendVerificationEmail(usernameOrEmail);
        } catch (Exception e) {
            // Không tiết lộ thông tin
        }
        return ResponseEntity.ok(Map.of(
                "message", "Nếu tài khoản tồn tại và chưa được xác thực, email xác thực đã được gửi."
        ));
    }
}
