package com.example.HomestayDev.repository;

import com.example.HomestayDev.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ReviewRepository extends JpaRepository<Review, UUID> {
    List<Review> findByBookingHomestayId(UUID homestayId);
}
