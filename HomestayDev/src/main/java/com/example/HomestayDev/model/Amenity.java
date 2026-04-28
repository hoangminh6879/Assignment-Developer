package com.example.HomestayDev.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "amenities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Amenity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, columnDefinition = "NVARCHAR(255)")
    private String name;

    @Column(name = "icon_url", columnDefinition = "NVARCHAR(255)")
    private String iconUrl;

    @OneToMany(mappedBy = "amenity")
    private List<HomestayAmenity> homestayAmenities;
}
