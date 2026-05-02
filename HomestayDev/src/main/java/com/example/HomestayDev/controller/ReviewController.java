package com.example.HomestayDev.controller;

import com.example.HomestayDev.dto.ReviewDto;
import com.example.HomestayDev.dto.ReviewRequestDto;
import com.example.HomestayDev.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping(value = "/reviews", consumes = "multipart/form-data")
    public ResponseEntity<ReviewDto> createReview(
            @RequestParam("bookingId") UUID bookingId,
            @RequestParam("rating") Integer rating,
            @RequestParam("comment") String comment,
            @RequestParam(value = "images", required = false) List<MultipartFile> images
    ) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        ReviewRequestDto request = new ReviewRequestDto(bookingId, rating, comment);
        return ResponseEntity.ok(reviewService.createReview(auth.getName(), request, images));
    }

    @PostMapping("/reviews/{id}/response")
    public ResponseEntity<ReviewDto> respondToReview(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body
    ) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String response = body.get("response");
        return ResponseEntity.ok(reviewService.respondToReview(id, auth.getName(), response));
    }

    @GetMapping("/homestays/{id}/reviews")
    public ResponseEntity<List<ReviewDto>> getReviewsByHomestay(@PathVariable UUID id) {
        return ResponseEntity.ok(reviewService.getReviewsByHomestay(id));
    }

    @GetMapping("/reviews/host")
    public ResponseEntity<List<ReviewDto>> getHostReviews() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(reviewService.getReviewsByHost(auth.getName()));
    }
}
