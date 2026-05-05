package com.example.HomestayDev.controller;

import com.example.HomestayDev.dto.TransactionDto;
import com.example.HomestayDev.model.Transaction;
import com.example.HomestayDev.model.User;
import com.example.HomestayDev.model.Wallet;
import com.example.HomestayDev.repository.UserRepository;
import com.example.HomestayDev.service.WalletService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/wallets")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        Jwt jwt = (Jwt) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username = jwt.getClaimAsString("preferred_username");
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @GetMapping("/my-wallet")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getMyWallet() {
        User user = getCurrentUser();
        Wallet wallet = walletService.getWalletByUserId(user.getId());
        return ResponseEntity.ok(Map.of(
                "id", wallet.getId(),
                "balance", wallet.getBalance()
        ));
    }

    @GetMapping("/transactions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getMyTransactions() {
        try {
            User user = getCurrentUser();
            List<TransactionDto> dtos = walletService.getMyTransactions(user.getId());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/deposit")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> deposit(@RequestParam BigDecimal amount, HttpServletRequest request) {
        User user = getCurrentUser();
        String url = walletService.createDepositUrl(amount, user.getId(), request);
        return ResponseEntity.ok(Map.of("url", url));
    }

    @GetMapping("/vnpay-return")
    public void vnpayReturn(@RequestParam Map<String, String> allParams, HttpServletResponse response) throws Exception {
        boolean success = walletService.processDepositReturn(allParams);
        if (success) {
            response.sendRedirect("http://localhost:4200/payment-result?status=success");
        } else {
            response.sendRedirect("http://localhost:4200/payment-result?status=error");
        }
    }
}
