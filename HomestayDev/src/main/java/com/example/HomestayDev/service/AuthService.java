package com.example.HomestayDev.service;

import com.example.HomestayDev.dto.AuthResponse;
import com.example.HomestayDev.dto.LoginRequest;
import com.example.HomestayDev.dto.RegistrationRequest;
import com.example.HomestayDev.model.User;
import com.example.HomestayDev.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final Keycloak keycloak;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${keycloak.server-url}")
    private String serverUrl;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.client-id}")
    private String clientId;

    @Value("${keycloak.client-secret}")
    private String clientSecret;

    // ─────────────────────────────────────────────
    //  ĐĂNG KÝ — tạo user + gửi email xác thực
    // ─────────────────────────────────────────────
    public String register(RegistrationRequest request) {
        UserRepresentation user = new UserRepresentation();
        user.setEnabled(true);
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        // Keycloak bật Verify Email → emailVerified = false để buộc xác thực
        user.setEmailVerified(false);

        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setTemporary(false);
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(request.getPassword());
        user.setCredentials(Collections.singletonList(credential));

        UsersResource usersResource = keycloak.realm(realm).users();
        Response response = usersResource.create(user);

        if (response.getStatus() == 201) {
            String userId = response.getLocation().getPath().replaceAll(".*/([^/]+)$", "$1");

            // Lưu vào database nội bộ
            User localUser = User.builder()
                    .keycloakId(UUID.fromString(userId))
                    .username(request.getUsername())
                    .email(request.getEmail())
                    .firstName(request.getFirstName())
                    .lastName(request.getLastName())
                    .phoneNumber(request.getPhoneNumber())
                    .isActive(true)
                    .build();
            userRepository.save(localUser);

            // Gán role mặc định USER
            RoleRepresentation userRole = keycloak.realm(realm).roles().get("USER").toRepresentation();
            usersResource.get(userId).roles().realmLevel().add(Collections.singletonList(userRole));

            // Gửi email xác thực (Keycloak Verify Email feature)
            try {
                usersResource.get(userId).executeActionsEmail(List.of("VERIFY_EMAIL"));
                log.info("Verification email sent to: {}", request.getEmail());
            } catch (Exception e) {
                log.warn("Could not send verification email for user {}: {}", userId, e.getMessage());
            }

            return "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.";
        } else {
            String errorBody = response.readEntity(String.class);
            log.error("Keycloak Error - Status: {}, Body: {}", response.getStatus(), errorBody);
            throw new RuntimeException("Đăng ký thất bại: " + errorBody);
        }
    }

    // ─────────────────────────────────────────────
    //  ĐĂNG NHẬP — hỗ trợ email + remember me
    // ─────────────────────────────────────────────
    public AuthResponse login(LoginRequest request) {
        String tokenUrl = serverUrl + "realms/" + realm + "/protocol/openid-connect/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        map.add("grant_type", "password");
        map.add("client_id", clientId);
        map.add("client_secret", clientSecret);
        // Keycloak bật "Login with Email" → tự nhận dạng username hoặc email
        map.add("username", request.getUsername());
        map.add("password", request.getPassword());

        // Remember Me → offline_access scope để refresh_token tồn tại lâu hơn
        if (request.isRememberMe()) {
            map.add("scope", "openid offline_access");
        } else {
            map.add("scope", "openid");
        }

        HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(map, headers);
        try {
            ResponseEntity<AuthResponse> response = restTemplate.postForEntity(tokenUrl, entity, AuthResponse.class);
            return response.getBody();
        } catch (HttpClientErrorException e) {
            String body = e.getResponseBodyAsString();
            log.error("Login failed for user {}: {}", request.getUsername(), body);
            // Phân tích lỗi từ Keycloak để đưa ra thông báo phù hợp
            String keycloakError = parseKeycloakErrorDescription(body);
            if (keycloakError != null && keycloakError.contains("not fully set up")) {
                throw new EmailNotVerifiedException(
                    "Tài khoản chưa được xác thực email. Vui lòng kiểm tra hộp thư của bạn hoặc yêu cầu gửi lại email xác thực."
                );
            }
            throw new RuntimeException("Tên đăng nhập/email hoặc mật khẩu không đúng!");
        }
    }

    /**
     * Phân tích error_description từ JSON response của Keycloak.
     */
    private String parseKeycloakErrorDescription(String body) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode node = mapper.readTree(body);
            return node.path("error_description").asText(null);
        } catch (Exception ex) {
            return null;
        }
    }

    // ─────────────────────────────────────────────
    //  GỬI LẠI EMAIL XÁC THỰC — cho tài khoản cũ
    // ─────────────────────────────────────────────
    public void resendVerificationEmail(String usernameOrEmail) {
        UsersResource usersResource = keycloak.realm(realm).users();

        // Tìm theo email trước
        List<UserRepresentation> users = usersResource.searchByEmail(usernameOrEmail, true);
        // Nếu không tìm theo email thì tìm theo username
        if (users == null || users.isEmpty()) {
            users = usersResource.searchByUsername(usernameOrEmail, true);
        }

        if (users == null || users.isEmpty()) {
            log.warn("Resend verification: user not found for: {}", usernameOrEmail);
            return; // Không tiết lộ thông tin
        }

        String userId = users.get(0).getId();
        try {
            usersResource.get(userId).executeActionsEmail(List.of("VERIFY_EMAIL"));
            log.info("Verification email resent to user: {}", usernameOrEmail);
        } catch (Exception e) {
            log.error("Failed to resend verification email: {}", e.getMessage());
            throw new RuntimeException("Không thể gửi email xác thực. Vui lòng thử lại sau.");
        }
    }

    /**
     * Exception đặc biệt để frontend biết đây là lỗi chưa xác thực email.
     */
    public static class EmailNotVerifiedException extends RuntimeException {
        public EmailNotVerifiedException(String message) {
            super(message);
        }
    }

    // ─────────────────────────────────────────────
    //  QUÊN MẬT KHẨU — trigger Keycloak gửi email
    // ─────────────────────────────────────────────
    public void forgotPassword(String email) {
        UsersResource usersResource = keycloak.realm(realm).users();
        List<UserRepresentation> users = usersResource.searchByEmail(email, true);

        if (users == null || users.isEmpty()) {
            // Không tiết lộ email có tồn tại hay không (bảo mật)
            log.warn("Forgot password requested for non-existent email: {}", email);
            return;
        }

        String userId = users.get(0).getId();
        try {
            usersResource.get(userId).executeActionsEmail(List.of("UPDATE_PASSWORD"));
            log.info("Password reset email sent to: {}", email);
        } catch (Exception e) {
            log.error("Failed to send password reset email for {}: {}", email, e.getMessage());
            throw new RuntimeException("Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.");
        }
    }

    // ─────────────────────────────────────────────
    //  REFRESH TOKEN — lấy access token mới
    // ─────────────────────────────────────────────
    public AuthResponse refreshToken(String refreshToken) {
        String tokenUrl = serverUrl + "realms/" + realm + "/protocol/openid-connect/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        map.add("grant_type", "refresh_token");
        map.add("client_id", clientId);
        map.add("client_secret", clientSecret);
        map.add("refresh_token", refreshToken);

        HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(map, headers);
        try {
            ResponseEntity<AuthResponse> response = restTemplate.postForEntity(tokenUrl, entity, AuthResponse.class);
            return response.getBody();
        } catch (HttpClientErrorException e) {
            log.error("Token refresh failed: {}", e.getResponseBodyAsString());
            throw new RuntimeException("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        }
    }

    // ─────────────────────────────────────────────
    //  LOGOUT — revoke refresh token phía Keycloak
    // ─────────────────────────────────────────────
    public void logout(String refreshToken) {
        String logoutUrl = serverUrl + "realms/" + realm + "/protocol/openid-connect/logout";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        map.add("client_id", clientId);
        map.add("client_secret", clientSecret);
        map.add("refresh_token", refreshToken);

        HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(map, headers);
        try {
            restTemplate.postForEntity(logoutUrl, entity, Void.class);
            log.info("User logged out successfully");
        } catch (HttpClientErrorException e) {
            log.warn("Logout request returned non-2xx: {}", e.getResponseBodyAsString());
        }
    }
}
