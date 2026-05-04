package com.example.HomestayDev.controller;

import com.example.HomestayDev.dto.VoucherDto;
import com.example.HomestayDev.service.VoucherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/vouchers")
@RequiredArgsConstructor
public class VoucherController {

    private final VoucherService voucherService;

    @GetMapping("/applicable/{hostId}")
    public ResponseEntity<List<VoucherDto>> getApplicableVouchers(@PathVariable UUID hostId) {
        return ResponseEntity.ok(voucherService.getApplicableVouchers(hostId));
    }

    @PostMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateVoucher(
            @RequestBody Map<String, Object> request) {
        String code = (String) request.get("code");
        BigDecimal amount = new BigDecimal(request.get("amount").toString());
        UUID hostId = UUID.fromString(request.get("hostId").toString());

        BigDecimal discount = voucherService.calculateDiscount(code, amount, hostId);
        return ResponseEntity.ok(Map.of(
                "valid", true,
                "discountAmount", discount
        ));
    }

    @GetMapping("/host")
    @PreAuthorize("hasRole('HOST')")
    public ResponseEntity<List<VoucherDto>> getMyVouchers(Authentication auth) {
        return ResponseEntity.ok(voucherService.getHostVouchers(auth.getName()));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<VoucherDto>> getAllVouchers() {
        return ResponseEntity.ok(voucherService.getAllVouchers());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('HOST', 'ADMIN')")
    public ResponseEntity<VoucherDto> createVoucher(@RequestBody VoucherDto dto, Authentication auth) {
        return ResponseEntity.ok(voucherService.createVoucher(dto, auth.getName()));
    }

    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasAnyRole('HOST', 'ADMIN')")
    public ResponseEntity<Void> toggleStatus(@PathVariable UUID id) {
        voucherService.toggleStatus(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('HOST', 'ADMIN')")
    public ResponseEntity<VoucherDto> updateVoucher(@PathVariable UUID id, @RequestBody VoucherDto dto) {
        return ResponseEntity.ok(voucherService.updateVoucher(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('HOST', 'ADMIN')")
    public ResponseEntity<Void> deleteVoucher(@PathVariable UUID id) {
        voucherService.deleteVoucher(id);
        return ResponseEntity.ok().build();
    }
}
