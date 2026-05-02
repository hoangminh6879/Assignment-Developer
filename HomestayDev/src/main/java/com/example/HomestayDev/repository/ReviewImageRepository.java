package com.example.HomestayDev.repository;

import com.example.HomestayDev.model.ReviewImage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface ReviewImageRepository extends JpaRepository<ReviewImage, UUID> {
}
