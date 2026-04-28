package com.example.HomestayDev.controller;

import com.example.HomestayDev.dto.AmenityDto;
import com.example.HomestayDev.service.AmenityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class AmenityController {

    private final AmenityService amenityService;

    @GetMapping("/amenities")
    public ResponseEntity<List<AmenityDto>> getAllAmenities() {
        return ResponseEntity.ok(amenityService.getAllAmenities());
    }

    @PostMapping("/admin/amenities")
    public ResponseEntity<AmenityDto> createAmenity(@RequestBody AmenityDto dto) {
        return ResponseEntity.ok(amenityService.createAmenity(dto));
    }

    @DeleteMapping("/admin/amenities/{id}")
    public ResponseEntity<Void> deleteAmenity(@PathVariable Long id) {
        amenityService.deleteAmenity(id);
        return ResponseEntity.ok().build();
    }
}
