package com.example.HomestayDev.service;

import com.example.HomestayDev.dto.ReviewDto;
import com.example.HomestayDev.dto.ReviewRequestDto;
import com.example.HomestayDev.model.*;
import com.example.HomestayDev.model.enums.BookingStatus;
import com.example.HomestayDev.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ReviewImageRepository reviewImageRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    @Transactional
    public ReviewDto createReview(String username, ReviewRequestDto request, List<MultipartFile> images) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You can only review your own bookings");
        }

        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new RuntimeException("Only completed bookings can be reviewed");
        }

        if (booking.getReview() != null) {
            throw new RuntimeException("This booking already has a review");
        }

        Review review = Review.builder()
                .booking(booking)
                .user(user)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        Review savedReview = reviewRepository.save(review);

        if (images != null && !images.isEmpty()) {
            for (MultipartFile file : images) {
                if (file.isEmpty()) continue;
                String url = fileStorageService.storeFile(file);
                ReviewImage reviewImage = ReviewImage.builder()
                        .review(savedReview)
                        .url(url)
                        .build();
                reviewImageRepository.save(reviewImage);
            }
        }

        return mapToDto(reviewRepository.findById(savedReview.getId()).get());
    }

    @Transactional
    public ReviewDto respondToReview(UUID reviewId, String username, String response) {
        User host = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        // Verify that the user is the host of the homestay being reviewed
        if (!review.getBooking().getHomestay().getHost().getId().equals(host.getId())) {
            throw new RuntimeException("Only the host of this homestay can respond to this review");
        }

        review.setResponse(response);
        review.setResponseCreatedAt(LocalDateTime.now());

        return mapToDto(reviewRepository.save(review));
    }

    public List<ReviewDto> getReviewsByHomestay(UUID homestayId) {
        return reviewRepository.findByBookingHomestayId(homestayId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<ReviewDto> getReviewsByHost(String hostUsername) {
        User host = userRepository.findByUsername(hostUsername)
                .orElseThrow(() -> new RuntimeException("Host not found"));
        
        return reviewRepository.findAll().stream()
                .filter(r -> r.getBooking().getHomestay().getHost().getId().equals(host.getId()))
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public ReviewDto mapToDto(Review review) {
        return ReviewDto.builder()
                .id(review.getId())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .response(review.getResponse())
                .responseCreatedAt(review.getResponseCreatedAt())
                .userFullName(review.getUser().getFirstName() + " " + review.getUser().getLastName())
                .userUsername(review.getUser().getUsername())
                .bookingId(review.getBooking().getId())
                .homestayId(review.getBooking().getHomestay().getId())
                .homestayName(review.getBooking().getHomestay().getName())
                .imageUrls(review.getReviewImages() != null ? 
                        review.getReviewImages().stream().map(ReviewImage::getUrl).collect(Collectors.toList()) : List.of())
                .build();
    }
}
