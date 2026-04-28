package com.example.HomestayDev.repository;

import com.example.HomestayDev.model.HomestayAmenity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface HomestayAmenityRepository extends JpaRepository<HomestayAmenity, UUID> {
    void deleteByHomestayId(UUID homestayId);
}
