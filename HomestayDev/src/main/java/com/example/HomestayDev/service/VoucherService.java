package com.example.HomestayDev.service;

import com.example.HomestayDev.dto.VoucherDto;
import com.example.HomestayDev.model.User;
import com.example.HomestayDev.model.Voucher;
import com.example.HomestayDev.model.enums.VoucherType;
import com.example.HomestayDev.repository.UserRepository;
import com.example.HomestayDev.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VoucherService {

    private final VoucherRepository voucherRepository;
    private final UserRepository userRepository;

    public List<VoucherDto> getAllVouchers() {
        return voucherRepository.findAll().stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public List<VoucherDto> getHostVouchers(String hostUsername) {
        User host = userRepository.findByUsername(hostUsername)
                .orElseThrow(() -> new RuntimeException("Host not found"));
        return voucherRepository.findByHostId(host.getId()).stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public List<VoucherDto> getGlobalVouchers() {
        return voucherRepository.findByIsGlobalTrue().stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public List<VoucherDto> getApplicableVouchers(UUID hostId) {
        return voucherRepository.findApplicableVouchers(hostId).stream()
                .filter(Voucher::isActive)
                .filter(v -> v.getExpiryDate() == null || v.getExpiryDate().isAfter(LocalDate.now().minusDays(1)))
                .filter(v -> v.getUsageLimit() == null || v.getUsedCount() < v.getUsageLimit())
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public VoucherDto createVoucher(VoucherDto dto, String creatorUsername) {
        User creator = userRepository.findByUsername(creatorUsername)
                .orElseThrow(() -> new RuntimeException("Creator not found"));

        Voucher voucher = Voucher.builder()
                .code(dto.getCode().toUpperCase())
                .type(dto.getType())
                .typeMirror(dto.getType())
                .value(dto.getValue())
                .valueMirror(dto.getValue())
                .minBookingAmount(dto.getMinBookingAmount())
                .maxDiscountAmount(dto.getMaxDiscountAmount())
                .expiryDate(dto.getExpiryDate())
                .usageLimit(dto.getUsageLimit())
                .isGlobal(dto.isGlobal())
                .creator(creator)
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .build();

        if (!dto.isGlobal()) {
            voucher.setHost(creator);
        }

        return mapToDto(voucherRepository.save(voucher));
    }

    public BigDecimal calculateDiscount(String code, BigDecimal bookingAmount, UUID hostId) {
        Voucher voucher = voucherRepository.findByCode(code.toUpperCase())
                .orElseThrow(() -> new RuntimeException("Voucher code invalid"));

        validateVoucher(voucher, bookingAmount, hostId);

        BigDecimal discount = BigDecimal.ZERO;
        if (voucher.getType() == VoucherType.FIXED_AMOUNT) {
            discount = voucher.getValue();
        } else {
            discount = bookingAmount.multiply(voucher.getValue()).divide(new BigDecimal("100"), RoundingMode.HALF_UP);
            if (voucher.getMaxDiscountAmount() != null && discount.compareTo(voucher.getMaxDiscountAmount()) > 0) {
                discount = voucher.getMaxDiscountAmount();
            }
        }

        return discount.min(bookingAmount); // Discount cannot exceed booking amount
    }

    public void validateVoucher(Voucher voucher, BigDecimal bookingAmount, UUID hostId) {
        if (!voucher.isActive()) {
            throw new RuntimeException("Voucher is not active");
        }
        if (voucher.getExpiryDate() != null && voucher.getExpiryDate().isBefore(LocalDate.now())) {
            throw new RuntimeException("Mã giảm giá đã hết hạn");
        }
        if (voucher.getUsageLimit() != null && voucher.getUsedCount() >= voucher.getUsageLimit()) {
            throw new RuntimeException("Voucher usage limit reached");
        }
        if (voucher.getMinBookingAmount() != null && bookingAmount.compareTo(voucher.getMinBookingAmount()) < 0) {
            throw new RuntimeException("Booking amount is below the minimum required for this voucher");
        }
        if (!voucher.isGlobal() && (voucher.getHost() == null || !voucher.getHost().getId().equals(hostId))) {
            throw new RuntimeException("This voucher is not applicable to this homestay");
        }
    }

    @Transactional
    public void incrementUsedCount(String code) {
        voucherRepository.findByCode(code.toUpperCase()).ifPresent(v -> {
            v.setUsedCount(v.getUsedCount() + 1);
            voucherRepository.save(v);
        });
    }

    @Transactional
    public void toggleStatus(UUID id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Voucher not found"));
        voucher.setActive(!voucher.isActive());
        voucherRepository.save(voucher);
    }

    @Transactional
    public VoucherDto updateVoucher(UUID id, VoucherDto dto) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Voucher not found"));
        
        voucher.setCode(dto.getCode().toUpperCase());
        voucher.setType(dto.getType());
        voucher.setTypeMirror(dto.getType());
        voucher.setValue(dto.getValue());
        voucher.setValueMirror(dto.getValue());
        voucher.setMinBookingAmount(dto.getMinBookingAmount());
        voucher.setMaxDiscountAmount(dto.getMaxDiscountAmount());
        voucher.setExpiryDate(dto.getExpiryDate());
        voucher.setUsageLimit(dto.getUsageLimit());
        voucher.setGlobal(dto.isGlobal());
        
        return mapToDto(voucherRepository.save(voucher));
    }

    @Transactional
    public void deleteVoucher(UUID id) {
        if (!voucherRepository.existsById(id)) {
            throw new RuntimeException("Voucher not found");
        }
        voucherRepository.deleteById(id);
    }

    private VoucherDto mapToDto(Voucher v) {
        return VoucherDto.builder()
                .id(v.getId())
                .code(v.getCode())
                .type(v.getType())
                .value(v.getValue())
                .minBookingAmount(v.getMinBookingAmount())
                .maxDiscountAmount(v.getMaxDiscountAmount())
                .expiryDate(v.getExpiryDate())
                .usageLimit(v.getUsageLimit())
                .usedCount(v.getUsedCount())
                .isGlobal(v.isGlobal())
                .hostId(v.getHost() != null ? v.getHost().getId() : null)
                .hostName(v.getHost() != null ? v.getHost().getUsername() : "Admin")
                .isActive(v.isActive())
                .createdAt(v.getCreatedAt())
                .build();
    }
}
