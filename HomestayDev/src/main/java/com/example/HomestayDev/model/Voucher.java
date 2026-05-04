package com.example.HomestayDev.model;

import com.example.HomestayDev.model.enums.VoucherType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Nationalized;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "vouchers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Voucher {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false)
    private VoucherType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private VoucherType typeMirror; // Redundant column in DB

    @Column(name = "discount_value", nullable = false)
    private BigDecimal value;

    @Column(name = "value", nullable = false)
    private BigDecimal valueMirror; // Redundant column in DB

    @Column(name = "min_booking_amount")
    private BigDecimal minBookingAmount;

    @Column(name = "max_discount_amount")
    private BigDecimal maxDiscountAmount;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "usage_limit")
    private Integer usageLimit;

    @Column(name = "used_count")
    @Builder.Default
    private Integer usedCount = 0;

    @Column(name = "is_global")
    private boolean isGlobal = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id")
    private User creator;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_id")
    private User host; // For host-specific vouchers

    @Column(name = "is_active")
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
