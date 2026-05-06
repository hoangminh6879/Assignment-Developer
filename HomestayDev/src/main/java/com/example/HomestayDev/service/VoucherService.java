package com.example.HomestayDev.service;

import com.example.HomestayDev.dto.VoucherDto;
import com.example.HomestayDev.model.User;
import com.example.HomestayDev.model.Voucher;
import com.example.HomestayDev.model.enums.VoucherType;
import com.example.HomestayDev.repository.UserRepository;
import com.example.HomestayDev.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Iterator;
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
    public VoucherDto createVoucher(VoucherDto dto, String creatorUsername, boolean isAdmin) {
        User creator = userRepository.findByUsername(creatorUsername)
                .orElseThrow(() -> new RuntimeException("Creator not found"));

        // Force isGlobal = false for hosts
        boolean isGlobal = isAdmin && dto.isGlobal();

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
                .isGlobal(isGlobal)
                .creator(creator)
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .build();

        if (!isGlobal) {
            voucher.setHost(creator);
        }

        return mapToDto(voucherRepository.save(voucher));
    }

    @Transactional
    public void importVouchers(MultipartFile file, String creatorUsername, boolean isAdmin) {
        User creator = userRepository.findByUsername(creatorUsername)
                .orElseThrow(() -> new RuntimeException("Creator not found"));

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();

            // Skip header
            if (rows.hasNext()) rows.next();

            List<Voucher> vouchers = new ArrayList<>();
            java.util.Set<String> codesInFile = new java.util.HashSet<>();
            java.util.List<String> duplicateCodesInFile = new java.util.ArrayList<>();
            java.util.List<String> existingCodesInDb = new java.util.ArrayList<>();

            while (rows.hasNext()) {
                Row row = rows.next();
                if (isRowEmpty(row)) continue;

                String code = getCellValueAsString(row.getCell(0));
                if (code == null || code.isBlank()) continue;
                code = code.toUpperCase();

                // Check for duplicate in the same file
                if (codesInFile.contains(code)) {
                    duplicateCodesInFile.add(code);
                } else {
                    codesInFile.add(code);
                }

                // Check if code already exists in database
                if (voucherRepository.existsByCode(code)) {
                    existingCodesInDb.add(code);
                }

                String typeStr = getCellValueAsString(row.getCell(1));
                VoucherType type = VoucherType.valueOf(typeStr.toUpperCase());

                BigDecimal value = getCellValueAsBigDecimal(row.getCell(2));
                BigDecimal minBookingAmount = getCellValueAsBigDecimal(row.getCell(3));
                BigDecimal maxDiscountAmount = getCellValueAsBigDecimal(row.getCell(4));
                LocalDate expiryDate = getCellValueAsLocalDate(row.getCell(5));
                Integer usageLimit = getCellValueAsInteger(row.getCell(6));
                
                boolean isGlobal = isAdmin && "TRUE".equalsIgnoreCase(getCellValueAsString(row.getCell(7)));

                Voucher voucher = Voucher.builder()
                        .code(code)
                        .type(type)
                        .typeMirror(type)
                        .value(value)
                        .valueMirror(value)
                        .minBookingAmount(minBookingAmount)
                        .maxDiscountAmount(maxDiscountAmount)
                        .expiryDate(expiryDate)
                        .usageLimit(usageLimit)
                        .isGlobal(isGlobal)
                        .creator(creator)
                        .isActive(true)
                        .createdAt(LocalDateTime.now())
                        .build();

                if (!isGlobal) {
                    voucher.setHost(creator);
                }
                vouchers.add(voucher);
            }

            // Throw exception if any duplicates were found
            if (!duplicateCodesInFile.isEmpty() || !existingCodesInDb.isEmpty()) {
                StringBuilder errorMsg = new StringBuilder("Lỗi import Voucher: ");
                if (!duplicateCodesInFile.isEmpty()) {
                    errorMsg.append("\n- Các mã trùng lặp trong file: ").append(String.join(", ", duplicateCodesInFile));
                }
                if (!existingCodesInDb.isEmpty()) {
                    errorMsg.append("\n- Các mã đã tồn tại trên hệ thống: ").append(String.join(", ", existingCodesInDb));
                }
                throw new RuntimeException(errorMsg.toString());
            }

            voucherRepository.saveAll(vouchers);
        } catch (IOException e) {
            throw new RuntimeException("Failed to parse Excel file: " + e.getMessage());
        }
    }

    private boolean isRowEmpty(Row row) {
        if (row == null) return true;
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null && cell.getCellType() != CellType.BLANK) return false;
        }
        return true;
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return null;
        switch (cell.getCellType()) {
            case STRING: return cell.getStringCellValue();
            case NUMERIC: return String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN: return String.valueOf(cell.getBooleanCellValue());
            default: return null;
        }
    }

    private BigDecimal getCellValueAsBigDecimal(Cell cell) {
        if (cell == null) return null;
        if (cell.getCellType() == CellType.NUMERIC) {
            return BigDecimal.valueOf(cell.getNumericCellValue());
        } else if (cell.getCellType() == CellType.STRING) {
            try {
                return new BigDecimal(cell.getStringCellValue());
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }

    private Integer getCellValueAsInteger(Cell cell) {
        if (cell == null) return null;
        if (cell.getCellType() == CellType.NUMERIC) {
            return (int) cell.getNumericCellValue();
        } else if (cell.getCellType() == CellType.STRING) {
            try {
                return Integer.parseInt(cell.getStringCellValue());
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }

    private LocalDate getCellValueAsLocalDate(Cell cell) {
        if (cell == null) return null;
        if (cell.getCellType() == CellType.NUMERIC) {
            if (DateUtil.isCellDateFormatted(cell)) {
                return cell.getDateCellValue().toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
            }
        } else if (cell.getCellType() == CellType.STRING) {
            try {
                return LocalDate.parse(cell.getStringCellValue());
            } catch (Exception e) {
                return null;
            }
        }
        return null;
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
    public VoucherDto updateVoucher(UUID id, VoucherDto dto, boolean isAdmin) {
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
        
        boolean isGlobal = isAdmin && dto.isGlobal();
        voucher.setGlobal(isGlobal);
        
        if (!isGlobal && voucher.getHost() == null) {
            // If it was global and now it's not (changed by admin or restricted for host), set host
            // (Note: this is a bit edge case for admin, but for host it's safer)
            // But usually we don't change global to host-specific easily.
        }

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
