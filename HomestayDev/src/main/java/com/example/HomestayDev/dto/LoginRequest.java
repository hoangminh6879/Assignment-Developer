package com.example.HomestayDev.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
    /**
     * Có thể là username hoặc email (Keycloak bật "Login with Email" tự nhận dạng).
     */
    private String username;
    private String password;

    /**
     * Khi true → thêm scope=offline_access để Keycloak cấp refresh_token tồn tại lâu hơn (Remember Me).
     */
    @JsonProperty("remember_me")
    private boolean rememberMe;
}
