package com.example.HomestayDev.repository;

import com.example.HomestayDev.model.HomestayImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface HomestayImageRepository extends JpaRepository<HomestayImage, UUID> {
    void deleteByHomestayId(UUID homestayId);
}
