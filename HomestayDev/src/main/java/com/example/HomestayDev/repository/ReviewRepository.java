package com.example.HomestayDev.repository;

import com.example.HomestayDev.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {
    List<Review> findByBookingHomestayId(UUID homestayId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.booking.homestay.host.username = :username")
    Double getAverageRatingForHost(@Param("username") String username);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.booking.homestay.host.username = :username")
    Long countReviewsForHost(@Param("username") String username);
}
