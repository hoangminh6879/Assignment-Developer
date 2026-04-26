package com.example.HomestayDev.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "homestay_images")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HomestayImage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String url;

    @Builder.Default
    @Column(name = "is_primary")
    private boolean isPrimary = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "homestay_id", nullable = false)
    private Homestay homestay;
}
