package com.example.HomestayDev.model;

import com.example.HomestayDev.model.enums.HomestayStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "homestays")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Homestay {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, columnDefinition = "NVARCHAR(255)")
    private String name;

    @Column(columnDefinition = "NVARCHAR(2000)")
    private String description;

    @Column(nullable = false, columnDefinition = "NVARCHAR(255)")
    private String address;

    @Column(nullable = false, columnDefinition = "NVARCHAR(255)")
    private String city;

    private Double longitude;
    private Double latitude;

    @Column(name = "price_per_night", nullable = false)
    private BigDecimal pricePerNight;

    @Column(name = "max_guests")
    private Integer maxGuests;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    private HomestayStatus status = HomestayStatus.PENDING;

    @Column(name = "admin_reason", columnDefinition = "NVARCHAR(1000)")
    private String adminReason;

    @Builder.Default
    @Column(name = "view_count")
    private Long viewCount = 0L;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_id", nullable = false)
    private User host;

    @OneToMany(mappedBy = "homestay", cascade = CascadeType.ALL)
    private List<Room> rooms;

    @OneToMany(mappedBy = "homestay", cascade = CascadeType.ALL)
    private List<HomestayAmenity> homestayAmenities;

    @OneToMany(mappedBy = "homestay", cascade = CascadeType.ALL)
    private List<HomestayImage> homestayImages;

    @OneToMany(mappedBy = "homestay")
    private List<Booking> bookings;
}
