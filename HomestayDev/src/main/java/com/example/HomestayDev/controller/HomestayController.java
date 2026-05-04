package com.example.HomestayDev.controller;

import com.example.HomestayDev.dto.HomestayDto;
import com.example.HomestayDev.model.enums.HomestayStatus;
import com.example.HomestayDev.service.HomestayService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class HomestayController {

    private final HomestayService homestayService;

    // PUBLIC
    @GetMapping(value = "/homestays", produces = "application/json")
    public ResponseEntity<?> getActiveHomestays() {
        try {
            return ResponseEntity.ok(homestayService.getActiveHomestays());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/homestays/{id}/view")
    public ResponseEntity<Void> incrementViewCount(@PathVariable("id") String id) {
        System.out.println("Incrementing view count for homestay ID: " + id);
        try {
            homestayService.incrementViewCount(UUID.fromString(id));
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace(); // Log stack trace to console
            return ResponseEntity.badRequest().build();
        }
    }

    // HOST
    @GetMapping("/host/homestays")
    public ResponseEntity<List<HomestayDto>> getHostHomestays() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(homestayService.getHostHomestays(auth.getName()));
    }

    @PostMapping(value = "/host/homestays", consumes = "multipart/form-data", produces = "application/json")
    public ResponseEntity<HomestayDto> createHomestay(
            @RequestParam("name") String name,
            @RequestParam("description") String description,
            @RequestParam("address") String address,
            @RequestParam("city") String city,
            @RequestParam("pricePerNight") BigDecimal pricePerNight,
            @RequestParam("maxGuests") Integer maxGuests,
            @RequestParam(value = "amenityIds", required = false) List<Long> amenityIds,
            @RequestParam(value = "images", required = false) List<MultipartFile> images
    ) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(homestayService.createHomestay(
                auth.getName(), name, description, address, city, pricePerNight, maxGuests, amenityIds, images));
    }

    @PutMapping(value = "/host/homestays/{id}", consumes = "multipart/form-data")
    public ResponseEntity<HomestayDto> updateHomestay(
            @PathVariable UUID id,
            @RequestParam("name") String name,
            @RequestParam("description") String description,
            @RequestParam("address") String address,
            @RequestParam("city") String city,
            @RequestParam("pricePerNight") BigDecimal pricePerNight,
            @RequestParam("maxGuests") Integer maxGuests,
            @RequestParam(value = "amenityIds", required = false) List<Long> amenityIds,
            @RequestParam(value = "images", required = false) List<MultipartFile> images,
            @RequestParam(value = "deleteImageIds", required = false) List<UUID> deleteImageIds
    ) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(homestayService.updateHomestay(
                id, auth.getName(), name, description, address, city, pricePerNight, maxGuests, amenityIds, images, deleteImageIds));
    }

    @DeleteMapping("/host/homestays/{id}")
    public ResponseEntity<Void> deleteHomestay(@PathVariable UUID id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        homestayService.deleteHomestay(id, auth.getName());
        return ResponseEntity.ok().build();
    }

    // ADMIN
    @GetMapping("/admin/homestays")
    public ResponseEntity<List<HomestayDto>> getAllHomestays() {
        return ResponseEntity.ok(homestayService.getAllHomestays());
    }

    @PutMapping("/admin/homestays/{id}/status")
    public ResponseEntity<HomestayDto> updateHomestayStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body
    ) {
        HomestayStatus status = HomestayStatus.valueOf(body.get("status"));
        String adminReason = body.get("adminReason");
        return ResponseEntity.ok(homestayService.updateStatus(id, status, adminReason));
    }
}
